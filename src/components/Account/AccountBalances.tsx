import React from "react"
import { Horizon } from "stellar-sdk"
import { useAccountData } from "../../hooks"
import InlineLoader from "../InlineLoader"

function addThousandsSeparators(digits: string, thousandsSeparator: string) {
  const digitGroups: string[] = []

  while (digits.length > 0) {
    digitGroups.push(digits.substr(-3))
    digits = digits.substr(0, digits.length - 3)
  }

  return digitGroups.reverse().join(thousandsSeparator)
}

function trimBalance(balance: number): string {
  if (balance === 0) {
    return "0"
  } else if (Math.round(balance) === balance) {
    return balance.toFixed(2)
  } else {
    return balance.toFixed(7)
  }
}

interface SingleBalanceProps {
  assetCode: string
  balance: string
  inline?: boolean
  style?: React.CSSProperties
}

export function SingleBalance(props: SingleBalanceProps) {
  const thousandsSeparator = ","
  const trimmedUnformattedBalance = trimBalance(Math.abs(parseFloat(props.balance)))
  const [integerPart, decimalPart = ""] = trimmedUnformattedBalance.split(".")
  return (
    <span style={props.style}>
      {parseFloat(props.balance) >= 0 ? null : <span>-&nbsp;</span>}
      <span style={{ fontWeight: 300 }}>
        {addThousandsSeparators(integerPart, thousandsSeparator)}
        <span style={{ opacity: 0.8 }}>{decimalPart ? "." + decimalPart : ""}</span>
      </span>
      {props.assetCode ? <>&nbsp;</> : null}
      <span
        style={{
          fontWeight: props.inline ? undefined : "bold",
          marginLeft: props.inline ? undefined : "0.4em"
        }}
      >
        {props.assetCode}
      </span>
    </span>
  )
}

interface MultipleBalancesProps {
  balances: Horizon.BalanceLine[]
  inline?: boolean
}

export function MultipleBalances(props: MultipleBalancesProps) {
  if (props.balances.length === 0) {
    return <></>
  }

  const byAssetCode = (balance1: any, balance2: any) => (balance1.asset_code < balance2.asset_code ? -1 : 1)
  const nativeBalance = props.balances.find(balance => balance.asset_type === "native")

  const balances = [
    ...(nativeBalance ? [nativeBalance] : []),
    ...props.balances.filter(balance => balance.asset_type !== "native").sort(byAssetCode)
  ]

  return (
    <>
      {balances.map((balance: any, index) => (
        <React.Fragment key={balance.asset_code || "XLM"}>
          <SingleBalance
            assetCode={balance.asset_type === "native" ? "XLM" : balance.asset_code}
            balance={balance.balance}
            inline={props.inline}
            style={index < balances.length - 1 ? { marginRight: "1.2em" } : undefined}
          />{" "}
        </React.Fragment>
      ))}
    </>
  )
}

const zeroXLMBalance = {
  asset_type: "native",
  balance: "0"
}

function AccountBalances(props: { publicKey: string; testnet: boolean }) {
  const accountData = useAccountData(props.publicKey, props.testnet)
  return accountData.loading ? (
    <InlineLoader />
  ) : accountData.activated ? (
    <MultipleBalances balances={accountData.balances} />
  ) : (
    <MultipleBalances balances={[zeroXLMBalance] as any} />
  )
}

export default AccountBalances
