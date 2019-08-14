import BigNumber from "big.js"
import React from "react"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { Account } from "../../context/accounts"
import { ObservedAccountData, useAccountOffers } from "../../hooks"

interface BreakdownItemProps {
  amount: React.ReactNode
  hide?: boolean
  primary: React.ReactNode
  secondary?: React.ReactNode
  style?: React.CSSProperties
  variant?: "deduction" | "total"
}

function BreakdownItem(props: BreakdownItemProps) {
  const { variant = "deduction" } = props

  if (props.hide) {
    return null
  }
  return (
    <ListItem style={{ marginTop: -16, ...props.style }}>
      <ListItemText primary={props.primary} secondary={props.secondary} style={{ marginLeft: "calc(56px + 2.5vw)" }} />
      <ListItemText
        primaryTypographyProps={{
          style: { fontSize: "140%" }
        }}
        style={{ textAlign: "right" }}
      >
        {variant === "deduction" ? "-" : "="}
        &nbsp;
        {props.amount}
      </ListItemText>
    </ListItem>
  )
}

interface Props {
  account: Account
  accountData: ObservedAccountData
  baseReserve: number
  style?: React.CSSProperties
}

function SpendableBalanceBreakdown(props: Props) {
  const openOrders = useAccountOffers(props.account.publicKey, props.account.testnet)

  const nativeBalance = props.accountData.balances.find(balance => balance.asset_type === "native")
  const trustedAssetBalances = props.accountData.balances.filter(balance => balance.asset_type !== "native")

  const dataReserve = props.baseReserve * Object.keys(props.accountData.data).length
  const openOrdersReserve = props.baseReserve * openOrders.offers.length
  const signersReserve = props.baseReserve * props.accountData.signers.length
  const trustlinesReserve = props.baseReserve * trustedAssetBalances.length

  const rawBalance = nativeBalance ? BigNumber(nativeBalance.balance) : BigNumber(0)
  const spendableBalance = rawBalance
    .minus(props.baseReserve)
    .minus(dataReserve)
    .minus(openOrdersReserve)
    .minus(signersReserve)
    .minus(trustlinesReserve)

  return (
    <>
      <BreakdownItem
        amount={props.baseReserve.toFixed(1)}
        primary="Base reserve"
        secondary="Fixed base reserve"
        style={props.style}
      />
      <BreakdownItem
        amount={signersReserve.toFixed(1)}
        primary="Account signers reserve"
        secondary={props.accountData.signers.length === 1 ? "Single key minimum reserve" : "Master key plus co-signers"}
        style={props.style}
      />
      <BreakdownItem
        amount={trustlinesReserve.toFixed(1)}
        hide={trustlinesReserve === 0}
        primary="Trustlines reserve"
        secondary="Reserve for every non-XLM balance"
        style={props.style}
      />
      <BreakdownItem
        amount={openOrdersReserve.toFixed(1)}
        hide={openOrdersReserve === 0}
        primary="Open orders reserve"
        secondary="Open trading orders on the SDEX"
        style={props.style}
      />
      <BreakdownItem
        amount={dataReserve.toFixed(1)}
        hide={dataReserve === 0}
        primary="Data fields reserve"
        secondary="Data fields set on the account"
        style={props.style}
      />
      <BreakdownItem
        amount={spendableBalance.toString()}
        primary="Spendable balance"
        secondary="Amount that can be freely used"
        style={props.style}
        variant="total"
      />
    </>
  )
}

export default React.memo(SpendableBalanceBreakdown)
