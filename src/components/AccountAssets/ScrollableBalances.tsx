import { Asset, Horizon } from "stellar-sdk"
import React from "react"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata, useIsMobile } from "../../hooks"
import { stringifyAsset } from "../../lib/stellar"
import { breakpoints } from "../../theme"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import { SingleBalance } from "../Account/AccountBalances"
import AssetLogo from "./AssetLogo"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

interface ScrollableBalancesStyleProps {
  horizontal: boolean
}

const useScrollableBalancesStyles = makeStyles({
  root: {
    display: "flex",
    fontSize: 18,
    marginLeft: -8,
    marginRight: -8,
    overflowX: "auto",
    transition: "background .25s",
    WebkitOverflowScrolling: "touch",

    [breakpoints.down(600)]: {
      marginLeft: -16,
      marginRight: -16
    }
  },
  balanceItem: (props: ScrollableBalancesStyleProps) => ({
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    flexDirection: props.horizontal ? "row" : "column",
    justifyContent: "flex-start",
    minWidth: 130,
    padding: "8px 16px",

    [breakpoints.down(600)]: {
      minWidth: 100,
      paddingLeft: props.horizontal ? undefined : 8,
      paddingRight: props.horizontal ? undefined : 8
    },
    [breakpoints.down(350)]: {
      minWidth: 90
    }
  }),
  clickable: {
    borderRadius: 6,
    cursor: "pointer",

    "&:hover": {
      background: "rgba(255, 255, 255, 0.05)"
    }
  },
  logo: (props: ScrollableBalancesStyleProps) => ({
    boxShadow: "0 0 2px #fff",
    boxSizing: "border-box",
    margin: 0,
    marginLeft: props.horizontal ? 0 : "auto",
    marginRight: props.horizontal ? 0 : "auto",
    width: 48,
    height: 48,

    [breakpoints.down(350)]: {
      width: 40,
      height: 40
    }
  }),
  balance: (props: ScrollableBalancesStyleProps) => ({
    fontSize: 16,
    marginTop: props.horizontal ? 0 : 8,
    marginLeft: props.horizontal ? 16 : 0,
    textAlign: props.horizontal ? "left" : "center"
  }),
  assetCode: {
    display: "block",
    fontWeight: 700
  }
})

interface BalanceWithLogoProps {
  assetMetadata?: StellarTomlCurrency
  balance: Horizon.BalanceLine
  horizontal: boolean
  onClick?: () => void
}

function BalanceWithLogo(props: BalanceWithLogoProps) {
  const classes = useScrollableBalancesStyles(props)

  return (
    <div className={`${classes.balanceItem} ${props.onClick ? classes.clickable : ""}`} onClick={props.onClick}>
      <AssetLogo
        balance={props.balance}
        className={classes.logo}
        imageURL={props.assetMetadata ? props.assetMetadata.image : undefined}
      />
      <div className={classes.balance}>
        <span className={classes.assetCode}>
          {props.balance.asset_type === "native" ? "XLM" : props.balance.asset_code}
        </span>
        <SingleBalance assetCode="" balance={props.balance.balance} inline />
      </div>
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
  const isSmallScreen = useIsMobile()
  const horizontal = !isSmallScreen || accountData.balances.length < 2
  const classes = useScrollableBalancesStyles({ horizontal })

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
    <div className={classes.root} style={props.style}>
      {trustedAssets.map(asset => {
        const [metadata] = assetMetadata.get(asset) || [undefined, false]
        return (
          <BalanceWithLogo
            key={stringifyAsset(asset)}
            assetMetadata={metadata}
            balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
            horizontal={horizontal}
            onClick={props.onClick}
          />
        )
      })}
      <BalanceWithLogo balance={nativeBalance} horizontal={horizontal} onClick={props.onClick} />
    </div>
  )
}

export default React.memo(ScrollableBalances)
