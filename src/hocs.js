import React from 'react'
import { observer } from 'mobx-react'
import { Server } from 'stellar-sdk'
import { subscribeToAccount } from './lib/subscriptions'

// TODO: Should probably be stored in context
const horizonLivenet = new Server('https://horizon.stellar.org/')
const horizonTestnet = new Server('https://horizon-testnet.stellar.org/')

const withHorizon = Component => {
  return props => <Component {...props} horizonLivenet={horizonLivenet} horizonTestnet={horizonTestnet} />
}

const withAccountData = ({ publicKey, testnet = false }) => Component => {
  const mapHorizonToAccountData = SubComponent => {
    return observer(props => {
      const horizon = testnet ? props.horizonTestnet : props.horizonLivenet
      const accountDataObservable = subscribeToAccount(horizon, publicKey)
      return <SubComponent accountData={accountDataObservable} />
    })
  }
  return withHorizon(mapHorizonToAccountData(Component))
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
