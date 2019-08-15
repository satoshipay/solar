import { Asset, Horizon } from "stellar-sdk"
import React from "react"
import Avatar from "@material-ui/core/Avatar"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata } from "../../hooks"
import { stringifyAsset } from "../../lib/stellar"
import { breakpoints, brandColor } from "../../theme"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import LumenIcon from "../Icon/Lumen"
import { SingleBalance } from "./AccountBalances"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

const useScrollableBalancesStyles = makeStyles({
  root: {
    display: "flex",
    fontSize: 18,
    overflowX: "auto",
    paddingTop: 8,
    paddingBottom: 8,
    transition: "background .25s",
    WebkitOverflowScrolling: "touch",

    [breakpoints.down(600)]: {
      fontSize: 16
    }
  },
  clickable: {
    borderRadius: 6,
    cursor: "pointer",
    margin: "-4px -6px",
    padding: "12px 6px",

    "&:hover": {
      background: "rgba(255, 255, 255, 0.05)"
    }
  },
  balanceItem: {
    flex: "0 0 auto",
    textAlign: "center",
    minWidth: 150
  },
  logo: {
    boxShadow: "0 0 2px #fff",
    boxSizing: "border-box",
    margin: "0 auto",
    width: 48,
    height: 48
  },
  imageAvatar: {
    backgroundColor: "white"
  },
  textAvatar: {
    backgroundColor: brandColor.main15,
    border: "1px solid rgba(255, 255, 255, 0.66)",
    color: "rgba(255, 255, 255, 1)",
    fontSize: 12,
    fontWeight: 500
  },
  xlmAvatar: {
    background: "white",
    color: "black"
  },
  icon: {
    width: "100%",
    height: "100%"
  },
  assetCode: {
    display: "block",
    margin: "12px auto 4px"
  }
})

interface BalanceWithLogoProps {
  assetMetadata?: StellarTomlCurrency
  balance: Horizon.BalanceLine
}

function BalanceWithLogo(props: BalanceWithLogoProps) {
  const classes = useScrollableBalancesStyles(props)

  const logo =
    props.balance.asset_type === "native" ? (
      <Avatar alt="Stellar Lumens" className={`${classes.logo} ${classes.xlmAvatar}`}>
        <LumenIcon className={classes.icon} />
      </Avatar>
    ) : (
      <Avatar
        alt={name}
        className={
          props.assetMetadata && props.assetMetadata.image
            ? `${classes.logo} ${classes.imageAvatar}`
            : `${classes.logo} ${classes.textAvatar}`
        }
      >
        {props.assetMetadata && props.assetMetadata.image ? (
          <img className={classes.icon} src={props.assetMetadata.image} />
        ) : (
          props.balance.asset_code
        )}
      </Avatar>
    )

  return (
    <div className={classes.balanceItem}>
      {logo}
      <span className={classes.assetCode}>
        {props.balance.asset_type === "native" ? "XLM" : props.balance.asset_code}
      </span>
      <SingleBalance assetCode="" balance={props.balance.balance} inline />
    </div>
  )
}

interface ScrollableBalancesProps {
  account: Account
  onClick?: () => void
  style?: React.CSSProperties
}

function ScrollableBalances(props: ScrollableBalancesProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const classes = useScrollableBalancesStyles(props)

  const trustedAssets = accountData.balances
    .filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native")
    .map(balance => new Asset(balance.asset_code, balance.asset_issuer))

  const nativeBalance: Horizon.BalanceLineNative = accountData.balances.find(
    (balance): balance is Horizon.BalanceLineNative => balance.asset_type === "native"
  ) || {
    asset_type: "native",
    balance: "0",
    buying_liabilities: "0",
    selling_liabilities: "0"
  }

  const assetMetadata = useAssetMetadata(trustedAssets, props.account.testnet)

  return (
    <div
      className={`${classes.root} ${props.onClick ? classes.clickable : ""}`}
      onClick={props.onClick}
      style={props.style}
    >
      {trustedAssets.map(asset => {
        const [metadata] = assetMetadata.get(asset) || [undefined, false]
        return (
          <BalanceWithLogo
            key={stringifyAsset(asset)}
            assetMetadata={metadata}
            balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
          />
        )
      })}
      <BalanceWithLogo balance={nativeBalance} />
    </div>
  )
}

export default React.memo(ScrollableBalances)
