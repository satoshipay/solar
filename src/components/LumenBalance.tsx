import React from 'react'
import { withBalance } from '../hocs'

const LumenBalance = (props: { balance: number }) => {
  if (props.balance < 0) {
    return <>''</>
  } else {
    const trimmedBalance = props.balance.toFixed(7).replace(/00$/, '')
    return <span><small style={{ fontSize: '85%' }}>XLM</small> {trimmedBalance}</span>
  }
}

const AccountBalance = (props: { publicKey: string, testnet?: boolean }) => {
  const Component = withBalance(props)(LumenBalance)
  return <Component />
}

export {
  AccountBalance,
  LumenBalance
}
