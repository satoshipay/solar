import React from "react"
import { Horizon } from "stellar-sdk"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import { breakpoints } from "../../theme"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import { SingleBalance } from "../Account/AccountBalances"
import { AccountName } from "../Fetchers"
import AssetLogo from "./AssetLogo"

export const actionsSize = 36

const useBalanceItemStyles = makeStyles({
  clickable: {
    backgroundColor: "transparent",
    filter: "none",
    transition: "filter .3s",

    "&:hover": {
      backgroundColor: "transparent",
      filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2))"
    }
  },
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
  actions?: React.ReactNode
  assetMetadata?: StellarTomlCurrency
  balance: Horizon.BalanceLine
  hideBalance?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  testnet: boolean
}

function BalanceListItem(props: BalanceListItemProps) {
  const classes = useBalanceItemStyles()
  const balance = React.useMemo(
    () => (props.hideBalance ? null : <SingleBalance assetCode={""} balance={props.balance.balance} />),
    [props.balance]
  )

  if (props.balance.asset_type === "native") {
    return (
      <ListItem
        button={Boolean(props.onClick) as any}
        className={props.onClick ? classes.clickable : undefined}
        onClick={props.onClick}
        style={props.style}
      >
        <ListItemIcon className={classes.icon}>
          <AssetLogo balance={props.balance} className={classes.logo} />
        </ListItemIcon>
        <ListItemText
          classes={{
            root: classes.mainListItemText,
            primary: classes.mainListItemTextPrimaryTypography,
            secondary: classes.mainListItemTextSecondaryTypography
          }}
          primary="Stellar Lumens (XLM)"
          secondary="stellar.org"
        />
        <ListItemText
          classes={{
            root: classes.balanceListItemText,
            primary: classes.balanceText
          }}
          primary={balance}
        />
        <ListItemText className={classes.actions} />
      </ListItem>
    )
  }

  const assetName = (props.assetMetadata && props.assetMetadata.name) || props.balance.asset_code
  const title =
    assetName !== props.balance.asset_code ? `${assetName} (${props.balance.asset_code})` : props.balance.asset_code

  return (
    <ListItem
      button={Boolean(props.onClick) as any}
      className={props.onClick ? classes.clickable : undefined}
      onClick={props.onClick}
      style={props.style}
    >
      <ListItemIcon className={classes.icon}>
        <AssetLogo
          balance={props.balance}
          className={classes.logo}
          dark
          imageURL={props.assetMetadata && props.assetMetadata.image}
        />
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
      />
      <ListItemText className={classes.actions}>{props.actions}</ListItemText>
    </ListItem>
  )
}

export default React.memo(BalanceListItem)
