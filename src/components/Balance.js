import React from 'react'
import { lifecycle } from 'recompose'
import { withHorizon } from '../hocs'
import { subscribeToAccount } from '../lib/subscriptions'

const balanceUnknown = -1

const getBalance = accountData => {
  const balanceObject = accountData.balances.find(balance => balance.asset_type === 'native')
  return balanceObject ? parseFloat(balanceObject.balance) : 0
}

const StatelessBalance = ({ balance, publicKey }) => {
  if (balance === balanceUnknown) {
    return ''
  } else {
    return `XLM ${balance.toFixed(7).replace(/00$/, '')}`
  }
}

const Balance = lifecycle({
  componentWillMount () {
    const { publicKey, testnet = false } = this.props
    const horizon = testnet ? this.props.horizonTestnet : this.props.horizon
    const balanceSubscription = subscribeToAccount(horizon, publicKey)

    balanceSubscription.subscribe(accountData => {
      this.setState({ balance: getBalance(accountData) })
    })

    this.setState({
      balance: balanceUnknown,
      balanceSubscription
    })
  },
  componenWillUnmount () {
    const { balanceSubscription } = this.state
    balanceSubscription.unsubscribe()
  }
})(StatelessBalance)

export default withHorizon(Balance)
