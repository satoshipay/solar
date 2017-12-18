import React from 'react'
import CircularProgress from 'material-ui/CircularProgress'
import { observer } from 'mobx-react'
import { Server } from 'stellar-sdk'
import { subscribeToAccount, subscribeToRecentTxs } from './lib/subscriptions'

// TODO: Should probably be stored in context
const horizonLivenet = new Server('https://horizon.stellar.org/')
const horizonTestnet = new Server('https://horizon-testnet.stellar.org/')

const withHorizon = Component => {
  return props => <Component {...props} horizonLivenet={horizonLivenet} horizonTestnet={horizonTestnet} />
}

const withAccountData = ({ publicKey, testnet = false }) => Component => {
  const mapHorizonToAccountData = SubComponent => {
    return props => {
      const horizon = testnet ? props.horizonTestnet : props.horizonLivenet
      const accountDataObservable = subscribeToAccount(horizon, publicKey)
      return <SubComponent {...props} accountData={accountDataObservable} />
    }
  }
  return withHorizon(mapHorizonToAccountData(observer(Component)))
}

const getBalance = accountData => {
  const balanceUnknown = -1
  const balanceObject = accountData.balances.find(balance => balance.asset_type === 'native')
  return balanceObject ? parseFloat(balanceObject.balance) : balanceUnknown
}

export const withBalance = ({ publicKey, testnet = false }) => Component => {
  const mapAccountDataToBalance = SubComponent => {
    const WithBalance = props => <SubComponent {...props} balance={getBalance(props.accountData)} />
    return observer(WithBalance)
  }
  return withAccountData({ publicKey, testnet })(mapAccountDataToBalance(Component))
}

export const withTransactions = ({ publicKey, testnet = false }) => Component => {
  const mapToTransactions = SubComponent => {
    const DestructureRecentTxsObject = observer(({ recentTxs, ...props }) => {
      return <SubComponent {...props} loading={recentTxs.loading} transactions={recentTxs.transactions} />
    })
    const WithTransactions = props => {
      const horizon = testnet ? props.horizonTestnet : props.horizonLivenet
      const observableRecentTransactions = subscribeToRecentTxs(horizon, publicKey)
      return <DestructureRecentTxsObject {...props} recentTxs={observableRecentTransactions} />
    }
    return WithTransactions
  }
  return withHorizon(mapToTransactions(observer(Component)))
}

export const withSpinner = Component => {
  const ObservingComponent = observer(Component)
  const Spinner = () => (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <CircularProgress />
    </div>
  )
  const WithLoader = props => {
    if (props.loading) {
      return <Spinner />
    } else {
      return <ObservingComponent {...props} />
    }
  }
  return WithLoader
}
