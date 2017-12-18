import React from 'react'
import { withBalance } from '../hocs'

const LumenBalance = ({ balance }) => {
  if (balance < 0) {
    return ''
  } else {
    const trimmedBalance = balance.toFixed(7).replace(/00$/, '')
    return <span><small style={{ fontSize: '85%' }}>XLM</small> {trimmedBalance}</span>
  }
}

const AccountBalance = ({ publicKey, testnet = false }) => {
  const Component = withBalance({ publicKey, testnet })(LumenBalance)
  return <Component />
}

export {
  AccountBalance,
  LumenBalance
}
