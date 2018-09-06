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

// TODO: Should probably be stored in context
const horizonLivenet = new Server("https://horizon.stellar.org/")
const horizonTestnet = new Server("https://horizon-testnet.stellar.org/")

type HorizonRenderProp = (horizon: Server) => React.ReactElement<any>

/**
 * @example
 * <Horizon testnet={false}>
 *   {horizon => (
 *     <div>Currently used horizon server: {horizon.serverURL}</div>
 *   )}
 * </Horizon>
 */
export const Horizon = (props: { children: HorizonRenderProp; testnet: boolean }) => {
  const horizon = props.testnet ? horizonTestnet : horizonLivenet
  return props.children(horizon)
}

type AccountDataRenderProp = (accountData: AccountObservable, activated: boolean) => React.ReactElement<any>

// Utility component for <AccountData>
// It's important to render the children in a React.Fragment (<></>) to prevent random unmounts/remounts of the children
const AccountDataObserver = observer<
  React.StatelessComponent<{ accountData: AccountObservable; children: AccountDataRenderProp }>
>(({ accountData, children }) => {
  return <>{children(accountData, accountData.activated)}</>
})

export const AccountData = (props: { children: AccountDataRenderProp; publicKey: string; testnet: boolean }) => {
  return (
    <Horizon testnet={props.testnet}>
      {(horizon: Server) => (
        <AccountDataObserver accountData={subscribeToAccount(horizon, props.publicKey)} children={props.children} />
      )}
    </Horizon>
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
