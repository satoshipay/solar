import React from 'react'
import { withBalance } from '../hocs'

const LumenBalance = ({ balance }) => {
  if (balance < 0) {
    return ''
  } else {
    return `XLM ${balance.toFixed(7).replace(/00$/, '')}`
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
