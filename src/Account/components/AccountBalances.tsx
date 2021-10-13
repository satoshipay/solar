import BigNumber from "big.js"
import React from "react"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { BalanceLine } from "~Generic/lib/account"
import { formatBalance, sortBalances, BalanceFormattingOptions } from "~Generic/lib/balances"
import { balancelineToAsset, stringifyAsset } from "~Generic/lib/stellar"

interface SingleBalanceProps {
  assetCode: string
  balance: BigNumber | string
  inline?: boolean
  untrimmed?: boolean
  style?: React.CSSProperties
}

export const SingleBalance = React.memo(function SingleBalance(props: SingleBalanceProps) {
  const balance = BigNumber(props.balance).abs()

  const formattingOptions: BalanceFormattingOptions = props.untrimmed
    ? { minimumSignificants: 7 }
    : balance.eq(0)
    ? { maximumDecimals: 0, minimumDecimals: 0 }
    : balance.gt(0) && balance.lt(0.0001)
    ? { maximumDecimals: 7, minimumDecimals: 7 }
    : balance.lt(1000)
    ? { maximumDecimals: 4, minimumDecimals: 0 }
    : { maximumDecimals: 0, minimumDecimals: 0 }

  const formattedBalance = formatBalance(balance, formattingOptions)
  const [integerPart, decimalPart = ""] = formattedBalance.split(".")
  return (
    <span style={{ whiteSpace: "nowrap", ...props.style }}>
      <span style={{ display: "inline-block" }}>
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
              marginLeft: props.inline ? undefined : "0.4em"
            }}
          >
            {props.assetCode}
          </span>
        </>
      ) : null}
    </span>
  )
})

interface MultipleBalancesProps {
  balances: BalanceLine[]
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
      {balances.map((balance: BalanceLine, index) => (
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
  const accountData = useLiveAccountData(props.publicKey, props.testnet)

  return accountData.balances.length > 0 ? (
    <MultipleBalances balances={accountData.balances} component={props.component} onClick={props.onClick} />
  ) : (
    <MultipleBalances balances={[zeroXLMBalance] as any} component={props.component} onClick={props.onClick} />
  )
}

export default React.memo(AccountBalances)
