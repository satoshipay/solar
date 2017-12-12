import React from 'react'
import { lifecycle } from 'recompose'
import { observer } from 'mobx-react'
import { withHorizon } from '../hocs'
import { subscribeToAccount } from '../lib/subscriptions'

const balanceUnknown = -1

const getBalance = accountData => {
  const balanceObject = accountData.balances.find(balance => balance.asset_type === 'native')
  return balanceObject ? parseFloat(balanceObject.balance) : balanceUnknown
}

const StatelessBalance = observer(({ accountDataObservable }) => {
  const balance = getBalance(accountDataObservable)

  if (balance === balanceUnknown) {
    return ''
  } else {
    return `XLM ${balance.toFixed(7).replace(/00$/, '')}`
  }
})

const Balance = ({ horizonLivenet, horizonTestnet, publicKey, testnet }) => {
  const horizon = testnet ? horizonTestnet : horizonLivenet
  const accountDataObservable = subscribeToAccount(horizon, publicKey)
  return <StatelessBalance accountDataObservable={accountDataObservable} />
}

export default withHorizon(observer(Balance))
