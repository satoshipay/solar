/**
 * This file contains reactive components that subscribe to data (like an account balance) and
 * re-render their contents whenever the data changes.
 *
 * These components do not render any UI by themselves. Wrap your representational components in
 * them to obtain some data and receive live updates.
 */

import React from "react"
import { Server, Transaction } from "stellar-sdk"
import { observer } from "mobx-react"
import { subscribeToAccount, subscribeToRecentTxs, AccountObservable } from "../lib/subscriptions"
import { withHorizon } from "../hocs"

type HorizonRenderProp = (horizon: Server) => React.ReactElement<any>

/**
 * @example
 * <Horizon testnet={false}>
 *   {horizon => (
 *     <div>Currently used horizon server: {horizon.serverURL}</div>
 *   )}
 * </Horizon>
 */
const Horizon = withHorizon<{ children: HorizonRenderProp; testnet: boolean }>(
  (props: { children: HorizonRenderProp; horizonLivenet: Server; horizonTestnet: Server; testnet: boolean }) => {
    const horizon = props.testnet ? props.horizonTestnet : props.horizonLivenet
    return props.children(horizon)
  }
)

type AccountDataRenderProp = (accountData: AccountObservable, activated: boolean) => React.ReactElement<any>

const AccountData = (props: { children: AccountDataRenderProp; publicKey: string; testnet: boolean }) => {
  const AccountDataObserver = observer<React.StatelessComponent<{ accountData: AccountObservable }>>(
    ({ accountData }) => props.children(accountData, accountData.activated)
  )
  return (
    <Horizon testnet={props.testnet}>
      {(horizon: Server) => <AccountDataObserver accountData={subscribeToAccount(horizon, props.publicKey)} />}
    </Horizon>
  )
}

const unknownBalance = -1

const getBalance = (accountData: AccountObservable): number => {
  const balanceObject = accountData.balances.find(balance => balance.asset_type === "native")
  return balanceObject ? parseFloat(balanceObject.balance) : unknownBalance
}

type BalanceRenderProp = (balance: number, activated: boolean) => React.ReactElement<any>

/**
 * @example
 * <Balance publicKey='GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W' testnet>
 *   {balance => (
 *     <div>Current balance: XLM {balance}</div>
 *   )}
 * </Balance>
 */
export const Balance = (props: { children: BalanceRenderProp; publicKey: string; testnet: boolean }) => {
  return (
    <AccountData publicKey={props.publicKey} testnet={props.testnet}>
      {(accountData, activated) => props.children(getBalance(accountData), activated)}
    </AccountData>
  )
}

type TransactionsRenderProp = (
  data: { activated: boolean; loading: boolean; transactions: Transaction[] }
) => React.ReactElement<any>

/**
 * @example
 * <Transactions publicKey='GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W' testnet>
 *   {({ loading, transactions }) => transactions.map(
 *     tx => <TransactionSummary key={tx.hash().toString('hex')} tx={tx} />
 *   )}
 * </Transactions>
 */
export const Transactions = (props: { children: TransactionsRenderProp; publicKey: string; testnet: boolean }) => {
  return (
    <Horizon testnet={props.testnet}>
      {horizon => {
        const recentTxs = subscribeToRecentTxs(horizon, props.publicKey)
        const RecentTxsObserver = observer<React.StatelessComponent<{ recentTransactions: typeof recentTxs }>>(
          ({ recentTransactions }) => {
            // Had a weird issue with mobx: Didn't properly update when just passing down `recentTransactions`; destructuring solves the issue
            return props.children({
              activated: recentTransactions.activated,
              loading: recentTransactions.loading,

              // FIXME: Damn mobx. Will re-render this component on change, but won't
              // re-render the children components if we just pass down the same observable array without another `observer()`
              transactions: recentTransactions.transactions.slice()
            })
          }
        )

        return <RecentTxsObserver recentTransactions={recentTxs} />
      }}
    </Horizon>
  )
}
