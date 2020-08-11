import BigNumber from "big.js"
import React from "react"
import { useTranslation } from "react-i18next"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import { Account } from "~App/contexts/accounts"
import { useLiveAccountOffers } from "~Generic/hooks/stellar-subscriptions"
import { AccountData } from "~Generic/lib/account"
import { breakpoints } from "~App/theme"
import { SingleBalance } from "~Account/components/AccountBalances"

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
  const { offers: openOrders } = useLiveAccountOffers(props.account.publicKey, props.account.testnet)
  const { t } = useTranslation()

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
      <BreakdownHeadline right={t("account.balance-details.spendable-balances.headline")} />
      <BreakdownItem
        amount={rawBalance.toFixed(4)}
        primary={t("account.balance-details.spendable-balances.total-balance.primary")}
        secondary={t("account.balance-details.spendable-balances.total-balance.secondary")}
        style={props.style}
        variant="gross"
      />
      <BreakdownItem
        amount={props.baseReserve.toFixed(1)}
        indent
        primary={t("account.balance-details.spendable-balances.base-reserve.primary")}
        secondary={t("account.balance-details.spendable-balances.base-reserve.secondary")}
        style={props.style}
      />
      <BreakdownItem
        amount={signersReserve.toFixed(1)}
        indent
        primary={t("account.balance-details.spendable-balances.signers-reserve.primary")}
        secondary={
          props.accountData.signers.length === 1
            ? t("account.balance-details.spendable-balances.signers-reserve.secondary.single-key")
            : t("account.balance-details.spendable-balances.signers-reserve.secondary.multiple-keys")
        }
        style={props.style}
      />
      <BreakdownItem
        amount={trustlinesReserve.toFixed(1)}
        hide={trustlinesReserve === 0}
        indent
        primary={t("account.balance-details.spendable-balances.trustline-reserve.primary")}
        secondary={t("account.balance-details.spendable-balances.trustline-reserve.secondary")}
        style={props.style}
      />
      <BreakdownItem
        amount={openOrdersReserve.toFixed(1)}
        hide={openOrdersReserve === 0}
        indent
        primary={t("account.balance-details.spendable-balances.open-orders-reserve.primary")}
        secondary={t("account.balance-details.spendable-balances.open-orders-reserve.secondary")}
        style={props.style}
      />
      <BreakdownItem
        amount={dataReserve.toFixed(1)}
        hide={dataReserve === 0}
        indent
        primary={t("account.balance-details.spendable-balances.data-reserve.primary")}
        secondary={t("account.balance-details.spendable-balances.data-reserve.secondary")}
        style={props.style}
      />
      <BreakdownItem
        amount={sellingLiabilities.toString()}
        hide={sellingLiabilities.eq(0)}
        indent
        primary={t("account.balance-details.spendable-balances.selling-liabilities.primary")}
        secondary={t("account.balance-details.spendable-balances.selling-liabilities.secondary")}
        style={props.style}
      />
      <BreakdownItem
        amount={spendableBalance.toString()}
        primary={t("account.balance-details.spendable-balances.spendable-balance.primary")}
        secondary={t("account.balance-details.spendable-balances.spendable-balance.secondary")}
        style={props.style}
        variant="total"
      />
    </List>
  )
}

export default React.memo(SpendableBalanceBreakdown)
