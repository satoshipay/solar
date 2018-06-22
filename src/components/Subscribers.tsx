import React from 'react'
import { Server, Transaction } from 'stellar-sdk'
import { observer } from 'mobx-react'
import { subscribeToAccount, subscribeToRecentTxs, AccountObservable } from '../lib/subscriptions'
import { withHorizon } from '../hocs'

interface HorizonProps {
  horizonLivenet: Server,
  horizonTestnet: Server
}

type HorizonRenderProp = (horizon: Server) => React.ReactElement<any>

const Horizon = withHorizon<{ children: HorizonRenderProp, testnet: boolean }>(
  (props: { children: HorizonRenderProp, horizonLivenet: Server, horizonTestnet: Server, testnet: boolean }) => {
    const horizon = props.testnet ? props.horizonTestnet : props.horizonLivenet
    return props.children(horizon)
  }
)

type AccountDataRenderProp = (accountData: AccountObservable) => React.ReactElement<any>

const AccountData = withHorizon((props: HorizonProps & { children: AccountDataRenderProp, publicKey: string, testnet: boolean }) => {
  const AccountDataObserver = observer<React.StatelessComponent<{ accountData: AccountObservable }>>(
    (subProps) => props.children(subProps.accountData)
  )
  return (
    <Horizon testnet={props.testnet}>
      {(horizon: Server) => <AccountDataObserver accountData={subscribeToAccount(horizon, props.publicKey)} />}
    </Horizon>
  )
})

const getBalance = (accountData: AccountObservable): number => {
  const balanceUnknown = -1
  const balanceObject = accountData.balances.find(balance => balance.asset_type === 'native')
  return balanceObject ? parseFloat(balanceObject.balance) : balanceUnknown
}

export const Balance = (props: { children: (balance: number) => React.ReactElement<any>, publicKey: string, testnet: boolean }) => {
  return (
    <AccountData publicKey={props.publicKey} testnet={props.testnet}>
      {accountData => props.children(getBalance(accountData))}
    </AccountData>
  )
}

type TransactionsRenderProp = (data: { loading: boolean, transactions: Transaction[] }) => React.ReactElement<any>

export const Transactions = (props: { children: TransactionsRenderProp, publicKey: string, testnet: boolean }) => {
  return (
    <Horizon testnet={props.testnet}>
      {horizon => {
        const recentTransactions = subscribeToRecentTxs(horizon, props.publicKey)
        const RecentTxsObserver = observer<React.StatelessComponent<{ recentTransactions: typeof recentTransactions }>>(
          (subProps) => props.children(subProps.recentTransactions)
        )

        return <RecentTxsObserver recentTransactions={recentTransactions} />
      }}
    </Horizon>
  )
}
