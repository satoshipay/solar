import BigNumber from "big.js"
import React from "react"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import { Account } from "../../context/accounts"
import { useLiveAccountOffers } from "../../hooks/stellar-subscriptions"
import { AccountData } from "../../lib/account"
import { breakpoints } from "../../theme"
import { SingleBalance } from "../Account/AccountBalances"

const useBreakdownItemStyles = makeStyles({
  root: {
    padding: 0
  },
  mainListItemText: {
    flexShrink: 5
  },
  mainListItemTextIndent: {
    marginLeft: 24,

    [breakpoints.down(600)]: {
      marginLeft: 12
    }
  },
  mainListItemTextPrimaryTypography: {
    fontSize: 18,
    fontWeight: 300,
    overflow: "hidden",
    textOverflow: "ellipsis",

    [breakpoints.down(400)]: {
      fontSize: 16,
      lineHeight: "20px"
    }
  },
  mainListItemTextSecondaryTypography: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",

    [breakpoints.down(400)]: {
      fontSize: 14
    },
    [breakpoints.down(350)]: {
      fontSize: 12
    }
  },
  balanceListItem: {
    marginLeft: 8,
    textAlign: "right"
  }
})

interface BreakdownItemProps {
  amount: string
  hide?: boolean
  indent?: boolean
  primary: React.ReactNode
  secondary?: React.ReactNode
  style?: React.CSSProperties
  variant?: "deduction" | "gross" | "total"
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
          root: `${classes.mainListItemText} ${props.indent ? classes.mainListItemTextIndent : ""}`,
          primary: classes.mainListItemTextPrimaryTypography,
          secondary: classes.mainListItemTextSecondaryTypography
        }}
        primary={props.primary}
        secondary={props.secondary}
      />
      <ListItemText
        className={classes.balanceListItem}
        primaryTypographyProps={{
          style: { fontSize: "150%" }
        }}
      >
        {variant === "deduction" ? "-" : variant === "gross" ? "" : "="}
        &nbsp;
        <SingleBalance assetCode="" balance={props.amount} />
      </ListItemText>
    </ListItem>
  )
}

const BreakdownHeadline = React.memo(function BreakdownHeadline(props: { left?: string; right?: string }) {
  const classes = useBreakdownItemStyles()

  return (
    <ListItem className={classes.root} style={{ borderBottom: "none" }}>
      <ListItemText
        classes={{
          root: classes.mainListItemText,
          primary: classes.mainListItemTextPrimaryTypography,
          secondary: classes.mainListItemTextSecondaryTypography
        }}
        primary={props.left}
      />
      <ListItemText
        className={classes.balanceListItem}
        primaryTypographyProps={{
          style: {
            fontSize: "120%",
            fontWeight: 300
          }
        }}
        style={{
          marginTop: 0,
          marginBottom: 0
        }}
      >
        {props.right}
      </ListItemText>
    </ListItem>
  )
})

interface Props {
  account: Account
  accountData: AccountData
  baseReserve: number
  style?: React.CSSProperties
}

function SpendableBalanceBreakdown(props: Props) {
  const openOrders = useLiveAccountOffers(props.account.publicKey, props.account.testnet)

  const nativeBalance = props.accountData.balances.find(balance => balance.asset_type === "native")
  const trustedAssetBalances = props.accountData.balances.filter(balance => balance.asset_type !== "native")

  const dataReserve = props.baseReserve * Object.keys(props.accountData.data_attr).length
  const openOrdersReserve = props.baseReserve * openOrders.length
  const signersReserve = props.baseReserve * props.accountData.signers.length
  const trustlinesReserve = props.baseReserve * trustedAssetBalances.length
  const sellingLiabilities = nativeBalance ? BigNumber(nativeBalance.selling_liabilities) : BigNumber(0)

  const rawBalance = nativeBalance ? BigNumber(nativeBalance.balance) : BigNumber(0)
  const spendableBalance = rawBalance
    .minus(props.baseReserve)
    .minus(dataReserve)
    .minus(openOrdersReserve)
    .minus(signersReserve)
    .minus(trustlinesReserve)
    .minus(sellingLiabilities)

  return (
    <List style={{ padding: 0 }}>
      <BreakdownHeadline right="Amounts in XLM" />
      <BreakdownItem
        amount={rawBalance.toFixed(1)}
        primary="Total balance"
        secondary="Your balance, incl. unspendable"
        style={props.style}
        variant="gross"
      />
      <BreakdownItem
        amount={props.baseReserve.toFixed(1)}
        indent
        primary="Base reserve"
        secondary="Fixed base reserve"
        style={props.style}
      />
      <BreakdownItem
        amount={signersReserve.toFixed(1)}
        indent
        primary="Account signers reserve"
        secondary={props.accountData.signers.length === 1 ? "Single key reserve" : "Master key + co-signers"}
        style={props.style}
      />
      <BreakdownItem
        amount={trustlinesReserve.toFixed(1)}
        hide={trustlinesReserve === 0}
        indent
        primary="Trustlines reserve"
        secondary="For each non-XLM balance"
        style={props.style}
      />
      <BreakdownItem
        amount={openOrdersReserve.toFixed(1)}
        hide={openOrdersReserve === 0}
        indent
        primary="Open orders reserve"
        secondary="Open SDEX orders"
        style={props.style}
      />
      <BreakdownItem
        amount={dataReserve.toFixed(1)}
        hide={dataReserve === 0}
        indent
        primary="Data fields reserve"
        secondary="Account data fields"
        style={props.style}
      />
      <BreakdownItem
        amount={sellingLiabilities.toString()}
        hide={sellingLiabilities.eq(0)}
        indent
        primary="Selling liabilities"
        secondary="Covers open orders"
        style={props.style}
      />
      <BreakdownItem
        amount={spendableBalance.toString()}
        primary="Spendable balance"
        secondary="Freely useable amount"
        style={props.style}
        variant="total"
      />
    </List>
  )
}

export default React.memo(SpendableBalanceBreakdown)
