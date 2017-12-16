import React from 'react'
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
    return observer(props => <SubComponent {...props} balance={getBalance(props.accountData)} />)
  }
  return withAccountData({ publicKey, testnet })(mapAccountDataToBalance(Component))
}

export const withTransactions = ({ publicKey, testnet = false }) => Component => {
  const mapToTransactions = SubComponent => {
    return props => {
      const horizon = testnet ? props.horizonTestnet : props.horizonLivenet
      const observableTransactions = subscribeToRecentTxs(horizon, publicKey)
      return <SubComponent {...props} transactions={observableTransactions} />
    }
  }
  return withHorizon(mapToTransactions(observer(Component)))
}
