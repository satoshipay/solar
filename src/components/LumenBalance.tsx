import React from 'react'
import { Balance } from '../data'

const LumenBalance = (props: { balance: number }) => {
  if (props.balance < 0) {
    return <>''</>
  } else {
    const trimmedBalance = props.balance.toFixed(7).replace(/00$/, '')
    return <span><small style={{ fontSize: '85%' }}>XLM</small> {trimmedBalance}</span>
  }
}

const AccountBalance = (props: { publicKey: string, testnet: boolean }) => {
  return (
    <Balance publicKey={props.publicKey} testnet={props.testnet}>
      {balance => <LumenBalance balance={balance} />}
    </Balance>
  )
}

export {
  AccountBalance,
  LumenBalance
}
