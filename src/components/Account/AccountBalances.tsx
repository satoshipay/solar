import BigNumber from "big.js"
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

function trimBalance(balance: BigNumber): string {
  if (balance.eq(0)) {
    return "0"
  } else if (balance.round().eq(balance)) {
    return balance.toFixed(2)
  } else {
    return balance.toFixed(7)
  }
}

export function formatBalance(
  input: BigNumber | string,
  options: { groupThousands?: boolean; minimumDecimals?: number; minimumSignificants?: number } = {}
) {
  if (typeof input === "string" && Number.isNaN(Number.parseFloat(input))) {
    return "-"
  }

  const balance = BigNumber(input)
  const thousandsSeparator = ","
  const maximumDecimals = 7
  const maximumSignificants = 13
  const { groupThousands = true, minimumDecimals = 0, minimumSignificants = 0 } = options

  const trimmedUnformattedBalance = trimBalance(balance.abs())

  // tslint:disable-next-line prefer-const
  let [integerPart, decimalPart = ""] = trimmedUnformattedBalance.split(".")

  if (decimalPart.length < minimumDecimals) {
    decimalPart += "0".repeat(minimumDecimals - decimalPart.length)
  } else if (decimalPart.length > maximumDecimals) {
    decimalPart = decimalPart.substr(0, maximumDecimals)
  }
  if (integerPart.length + decimalPart.length < minimumSignificants) {
    decimalPart += "0".repeat(minimumSignificants - integerPart.length - decimalPart.length)
  }
  if (integerPart.length + decimalPart.length > maximumSignificants && decimalPart.length > 0) {
    decimalPart = decimalPart.substr(0, maximumSignificants - integerPart.length)
  }

  return (
    (groupThousands ? addThousandsSeparators(integerPart, thousandsSeparator) : integerPart) +
    (decimalPart ? "." + decimalPart : "")
  )
}

interface SingleBalanceProps {
  assetCode: string
  balance: BigNumber | string
  inline?: boolean
  style?: React.CSSProperties
}

export function SingleBalance(props: SingleBalanceProps) {
  const thousandsSeparator = ","
  const balance = BigNumber(props.balance)
  const trimmedUnformattedBalance = trimBalance(balance.abs())
  const [integerPart, decimalPart = ""] = trimmedUnformattedBalance.split(".")
  return (
    <span style={props.style}>
      {balance.gte(0) ? null : <span>-&nbsp;</span>}
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
  component?: React.ComponentType<SingleBalanceProps>
  inline?: boolean
}

export function MultipleBalances(props: MultipleBalancesProps) {
  if (props.balances.length === 0) {
    return <></>
  }

  const Balance = props.component || SingleBalance
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
          <Balance
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

function AccountBalances(props: {
  component?: React.ComponentType<SingleBalanceProps>
  publicKey: string
  testnet: boolean
}) {
  const accountData = useAccountData(props.publicKey, props.testnet)
  return accountData.loading ? (
    <InlineLoader />
  ) : accountData.activated ? (
    <MultipleBalances balances={accountData.balances} component={props.component} />
  ) : (
    <MultipleBalances balances={[zeroXLMBalance] as any} component={props.component} />
  )
}

export default AccountBalances
