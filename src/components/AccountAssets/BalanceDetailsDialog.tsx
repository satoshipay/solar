import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import Avatar from "@material-ui/core/Avatar"
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
import { StellarTomlCurrency } from "../../types/stellar-toml"
import LumenIcon from "../Icon/Lumen"
import { Box, VerticalLayout } from "../Layout/Box"
import ErrorBoundary from "../ErrorBoundary"
import { AccountName } from "../Fetchers"
import MainTitle from "../MainTitle"
import SpendableBalanceBreakdown from "./SpendableBalanceBreakdown"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

const useBalanceItemStyles = makeStyles({
  avatar: {
    backgroundColor: "transparent"
  },
  textAvatar: {
    backgroundColor: "transparent",
    border: "2px solid rgba(0, 0, 0, 0.66)",
    boxSizing: "border-box",
    color: "rgba(0, 0, 0, 0.66)",
    fontSize: 12,
    fontWeight: 500
  },
  xlmAvatar: {
    background: "transparent",
    color: "black"
  },
  icon: {
    width: "100%",
    height: "100%"
  },
  mainListItemText: {
    flex: "1 1 auto",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  balanceListItemText: {
    flex: "1 0 180px",
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

  if (props.balance.asset_type === "native") {
    return (
      <ListItem style={props.style}>
        <ListItemIcon>
          <Avatar alt="Stellar Lumens" className={classes.xlmAvatar}>
            <LumenIcon className={classes.icon} />
          </Avatar>
        </ListItemIcon>
        <ListItemText
          className={classes.mainListItemText}
          primary="Stellar Lumens"
          secondary="Native token of the Stellar network"
        />
        <ListItemText
          className={classes.balanceListItemText}
          primary={props.balance.balance}
          primaryTypographyProps={{ className: classes.balanceText }}
        />
      </ListItem>
    )
  }
  const name = (props.assetMetadata && props.assetMetadata.name) || props.balance.asset_code
  return (
    <ListItem style={props.style}>
      <ListItemIcon>
        <Avatar
          alt={name}
          className={props.assetMetadata && props.assetMetadata.image ? classes.avatar : classes.textAvatar}
        >
          {props.assetMetadata && props.assetMetadata.image ? (
            <img className={classes.icon} src={props.assetMetadata.image} />
          ) : (
            props.balance.asset_code
          )}
        </Avatar>
      </ListItemIcon>
      <ListItemText
        className={classes.mainListItemText}
        primary={name}
        secondary={<AccountName publicKey={props.balance.asset_issuer} testnet={props.testnet} />}
      />
      <ListItemText
        className={classes.balanceListItemText}
        primary={props.balance.balance}
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
    <ErrorBoundary>
      <VerticalLayout width="100%" maxWidth={900} padding={isSmallScreen ? "24px" : " 24px 32px"} margin="0 auto">
        <Box margin="0 0 16px">
          <MainTitle onBack={props.onClose} title={props.account.name} />
        </Box>
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
              style={{ paddingLeft: itemHPadding, paddingRight: itemHPadding }}
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
      </VerticalLayout>
    </ErrorBoundary>
  )
}

export default React.memo(BalanceDetailsDialog)
