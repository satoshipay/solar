import React from "react"
import { AccountResponse } from "stellar-sdk"
import { AccountData } from "../Subscribers"
import InlineLoader from "../InlineLoader"

export const SingleBalance = (props: { assetCode: string; balance: string }) => {
  const balanceAsNumber = parseFloat(props.balance)
  const trimmedBalance = balanceAsNumber > 0 ? balanceAsNumber.toFixed(7).replace(/00$/, "") : "0"
  return (
    <span>
      <small style={{ fontSize: "85%", marginRight: 4 }}>{props.assetCode}</small>
      &nbsp;
      {trimmedBalance}
    </span>
  )
}

const Balances = (props: { balances: AccountResponse["balances"] }) => {
  if (props.balances.length === 0) {
    return <></>
  }

  const byAssetCode = (balance1: any, balance2: any) => (balance1.asset_code < balance2.asset_code ? -1 : 1)
  const balances = [
    props.balances.find(balance => balance.asset_type === "native"),
    ...props.balances.filter(balance => balance.asset_type !== "native").sort(byAssetCode)
  ]

  return (
    <>
      {balances.map((balance: any, index) => (
        <React.Fragment key={balance.asset_code || "XLM"}>
          {index > 0 ? <span style={{ margin: "0 8px", opacity: 0.8 }} /> : null}
          <SingleBalance
            assetCode={balance.asset_type === "native" ? "XLM" : balance.asset_code}
            balance={balance.balance}
          />{" "}
        </React.Fragment>
      ))}
    </>
  )
}

const AccountBalances = (props: { publicKey: string; testnet: boolean }) => {
  return (
    <AccountData publicKey={props.publicKey} testnet={props.testnet}>
      {(accountData, activated) => (activated ? <Balances balances={accountData.balances} /> : <InlineLoader />)}
    </AccountData>
  )
}

export default AccountBalances
