import React from 'react'
import CircularProgress from 'material-ui/CircularProgress'
import { observer } from 'mobx-react'
import { Server, Transaction } from 'stellar-sdk'
import { subscribeToAccount, subscribeToRecentTxs, AccountObservable, RecentTxsObservable } from './lib/subscriptions'

// TODO: Should probably be stored in context
const horizonLivenet = new Server('https://horizon.stellar.org/')
const horizonTestnet = new Server('https://horizon-testnet.stellar.org/')

export type HorizonProps = {
  horizonLivenet: Server,
  horizonTestnet: Server
}

export const withHorizon = <Props extends {}>(Component: React.ComponentType<Props & HorizonProps>) => {
  return (props: Props) => <Component {...props} horizonLivenet={horizonLivenet} horizonTestnet={horizonTestnet} />
}

type AccountDataProps = {
  accountData: AccountObservable
}

const withAccountData = <Props extends {}>(options: { publicKey: string, testnet?: boolean }) => {
  return (Component: React.ComponentType<Props & AccountDataProps>) => {
    const mapHorizonToAccountData = (SubComponent: React.ComponentType<Props & AccountDataProps>) => {
      return (props: Props & { horizonLivenet: Server, horizonTestnet: Server }) => {
        const horizon = options.testnet ? props.horizonTestnet : props.horizonLivenet
        const accountDataObservable = subscribeToAccount(horizon, options.publicKey)
        return <SubComponent {...props} accountData={accountDataObservable} />
      }
    }
    return withHorizon(mapHorizonToAccountData(observer(Component)))
  }
}

const getBalance = (accountData: AccountObservable): number => {
  const balanceUnknown = -1
  const balanceObject = accountData.balances.find(balance => balance.asset_type === 'native')
  return balanceObject ? parseFloat(balanceObject.balance) : balanceUnknown
}

type BalanceProps = AccountDataProps & {
  balance: number
}

export const withBalance = <Props extends {}>(options: { publicKey: string, testnet?: boolean }) => {
  return (Component: React.ComponentType<Props & BalanceProps>) => {
    const mapAccountDataToBalance = () => {
      const WithBalance = (props: Props & AccountDataProps) => <Component {...props} balance={getBalance(props.accountData)} />
      return observer(WithBalance)
    }
    return withAccountData<Props>(options)(mapAccountDataToBalance())
  }
}

type TransactionsProps = HorizonProps & {
  loading: boolean,
  recentTxs: RecentTxsObservable,
  transactions: Transaction[]
}

export const withTransactions = <Props extends {}>(options: { publicKey: string, testnet?: boolean }) => {
  return (Component: React.ComponentType<Props & TransactionsProps>) => {
    const mapToTransactions = (SubComponent: React.ComponentType<Props & TransactionsProps>) => {
      const DestructureRecentTxsObject = observer(({ recentTxs, ...props }) => {
        return <SubComponent {...props} loading={recentTxs.loading} transactions={recentTxs.transactions} />
      }) as React.ComponentType<Props & { recentTxs: RecentTxsObservable }>
      const WithTransactions = (props: Props & HorizonProps) => {
        const horizon = options.testnet ? props.horizonTestnet : props.horizonLivenet
        const observableRecentTransactions = subscribeToRecentTxs(horizon, options.publicKey)
        return <DestructureRecentTxsObject {...props} recentTxs={observableRecentTransactions} />
      }
      return WithTransactions
    }
    return withHorizon(mapToTransactions(observer(Component)))
  }
}

type SpinnerProps = {
  loading?: boolean
}

export const withSpinner = <Props extends {}>(Component: React.ComponentType<Props & SpinnerProps>) => {
  const ObservingComponent = observer(Component)
  const Spinner = () => (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <CircularProgress />
    </div>
  )
  const WithLoader = (props: Props & SpinnerProps) => {
    if (props.loading) {
      return <Spinner />
    } else {
      return <ObservingComponent {...props} />
    }
  }
  return WithLoader
}
