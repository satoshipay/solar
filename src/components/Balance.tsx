import React from "react"
import { Balance } from "./Subscribers"

const LumenBalance = (props: { balance: number }) => {
  if (props.balance < 0) {
    return <></>
  } else {
    const trimmedBalance = props.balance > 0 ? props.balance.toFixed(7).replace(/00$/, "") : "0"
    return (
      <span>
        <small style={{ fontSize: "85%" }}>XLM</small>&nbsp;{trimmedBalance}
      </span>
    )
  }
}

const AccountBalance = (props: { publicKey: string; testnet: boolean }) => {
  return (
    <Balance publicKey={props.publicKey} testnet={props.testnet}>
      {(balance, activated) => (activated ? <LumenBalance balance={balance} /> : <LumenBalance balance={0} />)}
    </Balance>
  )
}

export { AccountBalance, LumenBalance }
