import BigNumber from "big.js"
import React from "react"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import { Account } from "../../context/accounts"
import { useAccountOffers, ObservedAccountData } from "../../hooks"
import { breakpoints } from "../../theme"
import { SingleBalance } from "../Account/AccountBalances"

const useBreakdownItemStyles = makeStyles({
  root: {
    paddingTop: 0,
    paddingBottom: 0
  },
  mainListItemText: {
    flexShrink: 5,
    marginLeft: 56,

    [breakpoints.down(350)]: {
      marginLeft: 48
    }
  },
  mainListItemTextPrimaryTypography: {
    overflow: "hidden",
    textOverflow: "ellipsis",

    [breakpoints.down(400)]: {
      fontSize: 15
    },
    [breakpoints.down(350)]: {
      fontSize: 13
    }
  },
  mainListItemTextSecondaryTypography: {
    overflow: "hidden",
    textOverflow: "ellipsis",

    [breakpoints.down(400)]: {
      fontSize: 14
    },
    [breakpoints.down(350)]: {
      fontSize: 12
    }
  }
})

interface BreakdownItemProps {
  amount: string
  hide?: boolean
  primary: React.ReactNode
  secondary?: React.ReactNode
  style?: React.CSSProperties
  variant?: "deduction" | "total"
}

function BreakdownItem(props: BreakdownItemProps) {
  const { variant = "deduction" } = props
  const classes = useBreakdownItemStyles()

  if (props.hide) {
    return null
  }
  return (
    <ListItem className={classes.root} style={props.style}>
      <ListItemText
        classes={{
          root: classes.mainListItemText,
          primary: classes.mainListItemTextPrimaryTypography,
          secondary: classes.mainListItemTextSecondaryTypography
        }}
        primary={props.primary}
        secondary={props.secondary}
      />
      <ListItemText
        primaryTypographyProps={{
          style: { fontSize: "140%" }
        }}
        style={{ marginLeft: 8, textAlign: "right" }}
      >
        {variant === "deduction" ? "-" : "="}
        &nbsp;
        <SingleBalance assetCode="" balance={props.amount} />
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
        secondary={props.accountData.signers.length === 1 ? "Single key reserve" : "Master key + co-signers"}
        style={props.style}
      />
      <BreakdownItem
        amount={trustlinesReserve.toFixed(1)}
        hide={trustlinesReserve === 0}
        primary="Trustlines reserve"
        secondary="For each non-XLM balance"
        style={props.style}
      />
      <BreakdownItem
        amount={openOrdersReserve.toFixed(1)}
        hide={openOrdersReserve === 0}
        primary="Open orders reserve"
        secondary="Open SDEX orders"
        style={props.style}
      />
      <BreakdownItem
        amount={dataReserve.toFixed(1)}
        hide={dataReserve === 0}
        primary="Data fields reserve"
        secondary="Account data fields"
        style={props.style}
      />
      <BreakdownItem
        amount={spendableBalance.toString()}
        primary="Spendable balance"
        secondary="Freely useable amount"
        style={props.style}
        variant="total"
      />
    </>
  )
}

export default React.memo(SpendableBalanceBreakdown)
