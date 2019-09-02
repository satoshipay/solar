import BigNumber from "big.js"
import React from "react"
import { Horizon } from "stellar-sdk"
import { useAccountData } from "../../hooks"
import { balancelineToAsset, stringifyAsset } from "../../lib/stellar"
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

interface BalanceFormattingOptions {
  groupThousands?: boolean
  maximumDecimals?: number
  maximumSignificants?: number
  minimumDecimals?: number
  minimumSignificants?: number
}

export function formatBalance(input: BigNumber | string, options: BalanceFormattingOptions = {}) {
  if (typeof input === "string" && Number.isNaN(Number.parseFloat(input))) {
    return "-"
  }

  const balance = BigNumber(input)
  const thousandsSeparator = ","
  const {
    groupThousands = true,
    maximumDecimals = 7,
    maximumSignificants = 13,
    minimumDecimals = 0,
    minimumSignificants = 0
  } = options

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

export function sortBalances(balances: Horizon.BalanceLine[]) {
  const sorter = (balance1: Horizon.BalanceLineAsset, balance2: Horizon.BalanceLineAsset) => {
    if (Number.parseFloat(balance1.balance) === 0 && Number.parseFloat(balance2.balance) !== 0) {
      return 1
    } else if (Number.parseFloat(balance1.balance) !== 0 && Number.parseFloat(balance2.balance) === 0) {
      return -1
    }

    return balance1.asset_code === balance2.asset_code ? 0 : balance1.asset_code < balance2.asset_code ? -1 : 1
  }

  const nativeBalance = balances.find(balance => balance.asset_type === "native")

  return [
    ...balances.filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native").sort(sorter),
    ...(nativeBalance ? [nativeBalance] : [])
  ]
}

interface SingleBalanceProps {
  assetCode: string
  balance: BigNumber | string
  inline?: boolean
  untrimmed?: boolean
  style?: React.CSSProperties
}

export function SingleBalance(props: SingleBalanceProps) {
  const balance = BigNumber(props.balance).abs()

  const formattingOptions: BalanceFormattingOptions = props.untrimmed
    ? { minimumSignificants: 7 }
    : balance.eq(0)
      ? { maximumDecimals: 0, minimumDecimals: 0 }
      : balance.gt(0) && balance.lt(0.0001)
        ? { maximumDecimals: 7, minimumDecimals: 7 }
        : balance.lt(1000)
          ? { maximumDecimals: 4, minimumDecimals: 4 }
          : { maximumDecimals: 0, minimumDecimals: 0 }

  const formattedBalance = formatBalance(balance, formattingOptions)
  const [integerPart, decimalPart = ""] = formattedBalance.split(".")
  return (
    <span style={{ whiteSpace: "nowrap", ...props.style }}>
      <span style={{ display: "inline-block", minWidth: props.inline ? undefined : 65 }}>
        {balance.gte(0) ? null : <span>-&nbsp;</span>}
        <span style={{ fontWeight: 300 }}>
          {integerPart}
          <span style={{ opacity: 0.8 }}>{decimalPart ? "." + decimalPart : ""}</span>
        </span>
      </span>
      {props.assetCode ? (
        <>
          &nbsp;
          <span
            style={{
              display: "inline-block",
              fontWeight: props.inline ? undefined : "bold",
              marginLeft: props.inline ? undefined : "0.4em",
              minWidth: props.inline ? undefined : 45
            }}
          >
            {props.assetCode}
          </span>
        </>
      ) : null}
    </span>
  )
}

interface MultipleBalancesProps {
  balances: Horizon.BalanceLine[]
  component?: React.ComponentType<SingleBalanceProps>
  inline?: boolean
  onClick?: () => void
}

// tslint:disable-next-line no-shadowed-variable
export const MultipleBalances = React.memo(function MultipleBalances(props: MultipleBalancesProps) {
  if (props.balances.length === 0) {
    return <></>
  }

  const Balance = props.component || SingleBalance
  const balances = sortBalances(props.balances)

  return (
    <span onClick={props.onClick} style={props.onClick ? { cursor: "pointer" } : undefined}>
      {balances.map((balance: Horizon.BalanceLine, index) => (
        <React.Fragment key={stringifyAsset(balancelineToAsset(balance))}>
          <Balance
            assetCode={balance.asset_type === "native" ? "XLM" : balance.asset_code}
            balance={balance.balance}
            inline={props.inline}
            style={{ marginRight: index < balances.length - 1 ? "1.2em" : undefined }}
          />{" "}
        </React.Fragment>
      ))}
    </span>
  )
})

const zeroXLMBalance = {
  asset_type: "native",
  balance: "0"
}

function AccountBalances(props: {
  component?: React.ComponentType<SingleBalanceProps>
  onClick?: () => void
  publicKey: string
  testnet: boolean
}) {
  const accountData = useAccountData(props.publicKey, props.testnet)
  return accountData.loading ? (
    <InlineLoader />
  ) : accountData.activated ? (
    <MultipleBalances balances={accountData.balances} component={props.component} onClick={props.onClick} />
  ) : (
    <MultipleBalances balances={[zeroXLMBalance] as any} component={props.component} onClick={props.onClick} />
  )
}

export default AccountBalances
