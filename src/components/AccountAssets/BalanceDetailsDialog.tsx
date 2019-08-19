import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata, useIsMobile } from "../../hooks"
import { stringifyAsset } from "../../lib/stellar"
import { breakpoints } from "../../theme"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import { SingleBalance } from "../Account/AccountBalances"
import DialogBody from "../Dialog/DialogBody"
import { AccountName } from "../Fetchers"
import MainTitle from "../MainTitle"
import AssetLogo from "./AssetLogo"
import SpendableBalanceBreakdown from "./SpendableBalanceBreakdown"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

const useBalanceItemStyles = makeStyles({
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
    fontSize: "140%"
  }
})

interface BalanceListItemProps {
  assetMetadata?: StellarTomlCurrency
  balance: Horizon.BalanceLine
  style?: React.CSSProperties
  testnet: boolean
}

function BalanceListItem(props: BalanceListItemProps) {
  const classes = useBalanceItemStyles()
  const balance = React.useMemo(() => <SingleBalance assetCode={""} balance={props.balance.balance} />, [
    props.balance.balance
  ])

  if (props.balance.asset_type === "native") {
    return (
      <ListItem style={props.style}>
        <ListItemIcon className={classes.icon}>
          <AssetLogo balance={props.balance} className={classes.logo} />
        </ListItemIcon>
        <ListItemText
          className={classes.mainListItemText}
          classes={{
            primary: classes.mainListItemTextPrimaryTypography,
            secondary: classes.mainListItemTextSecondaryTypography
          }}
          primary="Stellar Lumens (XLM)"
          secondary="stellar.org"
        />
        <ListItemText
          className={classes.balanceListItemText}
          classes={{
            primary: classes.balanceText
          }}
          primary={balance}
        />
      </ListItem>
    )
  }
  const assetName = (props.assetMetadata && props.assetMetadata.name) || props.balance.asset_code
  const title =
    assetName !== props.balance.asset_code ? `${assetName} (${props.balance.asset_code})` : props.balance.asset_code

  return (
    <ListItem style={props.style}>
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
    </ListItem>
  )
}

interface BalanceDetailsProps {
  account: Account
  onClose: () => void
}

function BalanceDetailsDialog(props: BalanceDetailsProps) {
  const isLargeScreen = useMediaQuery("(min-width: 900px)")
  const isSmallScreen = useIsMobile()
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const trustedAssets = accountData.balances
    .filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native")
    .map(balance => new Asset(balance.asset_code, balance.asset_issuer))

  const nativeBalance = accountData.balances.find(
    (balance): balance is Horizon.BalanceLineNative => balance.asset_type === "native"
  )

  const assetMetadata = useAssetMetadata(trustedAssets, props.account.testnet)
  const hpadding = isSmallScreen ? 0 : "24px"
  const itemHPadding = isLargeScreen ? "16px" : 0

  return (
    <DialogBody top={<MainTitle onBack={props.onClose} title={props.account.name} />}>
      <List style={{ paddingLeft: hpadding, paddingRight: hpadding }}>
        {trustedAssets.map(asset => {
          const [metadata] = assetMetadata.get(asset) || [undefined, false]
          return (
            <BalanceListItem
              key={stringifyAsset(asset)}
              assetMetadata={metadata}
              balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
              style={{ paddingLeft: itemHPadding, paddingRight: itemHPadding }}
              testnet={props.account.testnet}
            />
          )
        })}
        {trustedAssets.length > 0 ? <Divider style={{ margin: "8px 0" }} /> : null}
        {nativeBalance ? (
          <BalanceListItem
            key="XLM"
            balance={nativeBalance}
            style={{ paddingLeft: itemHPadding, paddingRight: itemHPadding, paddingBottom: 0 }}
            testnet={props.account.testnet}
          />
        ) : null}
        <SpendableBalanceBreakdown
          account={props.account}
          accountData={accountData}
          baseReserve={0.5}
          style={{ paddingLeft: itemHPadding, paddingRight: itemHPadding }}
        />
      </List>
    </DialogBody>
  )
}

export default React.memo(BalanceDetailsDialog)
