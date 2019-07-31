import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import Avatar from "@material-ui/core/Avatar"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import { makeStyles } from "@material-ui/core/styles"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata } from "../../hooks"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import LumenIcon from "../Icon/Lumen"
import { Box, VerticalLayout } from "../Layout/Box"
import ErrorBoundary from "../ErrorBoundary"
import { AccountName } from "../Fetchers"
import MainTitle from "../MainTitle"

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
    flex: "1 1 auto"
  },
  balanceListItemText: {
    flex: "0 0 200px",
    textAlign: "right"
  },
  balanceText: {
    fontSize: "140%"
  }
})

interface BalanceListItemProps {
  assetMetadata?: StellarTomlCurrency
  balance: Horizon.BalanceLine
  loading?: boolean
  testnet: boolean
}

function BalanceListItem(props: BalanceListItemProps) {
  const classes = useBalanceItemStyles()
  if (props.balance.asset_type === "native") {
    return (
      <ListItem>
        <ListItemIcon>
          <Avatar alt="Stellar Lumen" className={classes.xlmAvatar}>
            <LumenIcon className={classes.icon} />
          </Avatar>
        </ListItemIcon>
        <ListItemText
          className={classes.mainListItemText}
          primary="Stellar Lumen"
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
    <ListItem>
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
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const assets = accountData.balances.map(
    balance => (balance.asset_type === "native" ? Asset.native() : new Asset(balance.asset_code, balance.asset_issuer))
  )

  assets.sort((a, b) => (a.isNative() ? -1 : 1))
  const assetMetadata = useAssetMetadata(assets, props.account.testnet)

  return (
    <ErrorBoundary>
      <VerticalLayout width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <Box margin="0 0 32px">
          <MainTitle onBack={props.onClose} title={props.account.name} />
        </Box>
        <List>
          {assets.map(asset => {
            const [metadata, loading] = assetMetadata.get(asset) || [undefined, false]
            return (
              <BalanceListItem
                key={asset.isNative() ? "XLM" : `${asset.getIssuer()}:${asset.getCode()}`}
                assetMetadata={metadata}
                balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
                loading={loading}
                testnet={props.account.testnet}
              />
            )
          })}
        </List>
      </VerticalLayout>
    </ErrorBoundary>
  )
}

export default React.memo(BalanceDetailsDialog)
