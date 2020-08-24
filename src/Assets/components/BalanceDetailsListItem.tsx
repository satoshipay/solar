import React from "react"
import { useTranslation } from "react-i18next"
import { Horizon } from "stellar-sdk"
import Badge from "@material-ui/core/Badge"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import { SettingsContext } from "~App/contexts/settings"
import { useAssetMetadata } from "~Generic/hooks/stellar"
import { balancelineToAsset } from "~Generic/lib/stellar"
import { breakpoints } from "~App/theme"
import { SingleBalance } from "~Account/components/AccountBalances"
import { AccountName } from "~Generic/components/Fetchers"
import { useFiatEstimate } from "~Generic/hooks/stellar-ecosystem"
import AssetLogo from "./AssetLogo"

export const actionsSize = 36

const useBalanceItemStyles = makeStyles({
  clickable: {},
  icon: {
    [breakpoints.down(350)]: {
      minWidth: 48
    }
  },
  logo: {
    [breakpoints.down(350)]: {
      width: 36,
      height: 36
    }
  },
  logoHidden: {
    visibility: "hidden"
  },
  badge: {
    top: 4,
    right: 4,
    boxShadow: "0 0 3px 1px white"
  },
  mainListItemText: {
    flex: "1 1 auto",
    whiteSpace: "nowrap"
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
  },
  balanceListItemText: {
    flex: "1 0 auto",
    marginLeft: 8,
    textAlign: "right"
  },
  balanceText: {
    fontSize: "140%",

    [breakpoints.down(350)]: {
      fontSize: "120%"
    }
  },
  actions: {
    flex: "0 0 auto",
    marginLeft: 4,
    marginRight: -16,
    width: 48
  }
})

interface BalanceListItemProps {
  badgeCount?: number
  balance: Horizon.BalanceLine
  className?: string
  hideBalance?: boolean
  hideLogo?: boolean
  onClick?: () => void
  spendableBalance?: boolean
  style?: React.CSSProperties
  testnet: boolean
}

function BalanceListItem(props: BalanceListItemProps) {
  const classes = useBalanceItemStyles()
  const className = `${props.className || ""} ${props.onClick ? classes.clickable : ""}`

  const settings = React.useContext(SettingsContext)

  const asset = React.useMemo(() => balancelineToAsset(props.balance), [props.balance])
  const assetMetadata = useAssetMetadata(asset, props.testnet)
  const fiatEstimate = useFiatEstimate(asset, settings.preferredCurrency, props.testnet)
  const { t } = useTranslation()

  const balance = React.useMemo(
    () => (props.hideBalance ? null : <SingleBalance assetCode={""} balance={props.balance.balance} />),
    [props.balance.balance, props.hideBalance]
  )

  if (props.balance.asset_type === "native") {
    const amountInPreferredCurrency = fiatEstimate.convertAmount(Number(props.balance.balance))
    const amountInPreferredCurrencyString = `${amountInPreferredCurrency.toFixed(2)} ${settings.preferredCurrency}`

    return (
      <ListItem
        button={Boolean(props.onClick) as any}
        className={className}
        onClick={props.onClick}
        style={props.style}
      >
        <ListItemIcon className={classes.icon}>
          <AssetLogo
            asset={asset}
            className={`${classes.logo} ${props.hideLogo ? classes.logoHidden : ""}`}
            testnet={props.testnet}
          />
        </ListItemIcon>
        <ListItemText
          classes={{
            root: classes.mainListItemText,
            primary: classes.mainListItemTextPrimaryTypography,
            secondary: classes.mainListItemTextSecondaryTypography
          }}
          primary={
            props.spendableBalance
              ? t("account.balance-details.item.spendable-balance.primary")
              : "Stellar Lumens (XLM)"
          }
          secondary={props.spendableBalance ? undefined : "stellar.org"}
        />
        <ListItemText
          classes={{
            root: classes.balanceListItemText,
            primary: classes.balanceText
          }}
          primary={balance}
          secondary={amountInPreferredCurrencyString}
        />
      </ListItem>
    )
  }

  const assetName = (assetMetadata && assetMetadata.name) || props.balance.asset_code
  const title =
    assetName !== props.balance.asset_code ? `${assetName} (${props.balance.asset_code})` : props.balance.asset_code

  const estimatedAmountInPreferredCurrency = fiatEstimate.convertAmount(Number(props.balance.balance))
  const estimatedAmountString = `${estimatedAmountInPreferredCurrency.toFixed(2)} ${settings.preferredCurrency}`

  return (
    <ListItem button={Boolean(props.onClick) as any} className={className} onClick={props.onClick} style={props.style}>
      <ListItemIcon className={classes.icon}>
        <Badge badgeContent={props.badgeCount} classes={{ badge: classes.badge }} color="primary">
          <AssetLogo
            asset={asset}
            className={`${classes.logo} ${props.hideLogo ? classes.logoHidden : ""}`}
            dark
            testnet={props.testnet}
          />
        </Badge>
      </ListItemIcon>
      <ListItemText
        className={classes.mainListItemText}
        classes={{
          primary: classes.mainListItemTextPrimaryTypography,
          secondary: classes.mainListItemTextSecondaryTypography
        }}
        primary={title}
        secondary={<AccountName publicKey={props.balance.asset_issuer} testnet={props.testnet} />}
      />
      <ListItemText
        className={classes.balanceListItemText}
        primary={balance}
        primaryTypographyProps={{ className: classes.balanceText }}
        secondary={estimatedAmountString}
      />
    </ListItem>
  )
}

export default React.memo(BalanceListItem)
