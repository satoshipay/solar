import { Horizon } from "stellar-sdk"
import React from "react"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { breakpoints } from "../../theme"
import { StellarTomlCurrency } from "../../types/stellar-toml"
import { SingleBalance } from "../Account/AccountBalances"
import AssetLogo from "./AssetLogo"

interface BalanceItemStyleProps {
  horizontal: boolean
}

const useBalanceItemStyles = makeStyles({
  root: (props: BalanceItemStyleProps) => ({
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
  logo: (props: BalanceItemStyleProps) => ({
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
  balance: (props: BalanceItemStyleProps) => ({
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

function BalanceItem(props: BalanceWithLogoProps) {
  const classes = useBalanceItemStyles(props)

  return (
    <div className={`${classes.root} ${props.onClick ? classes.clickable : ""}`} onClick={props.onClick}>
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

export default BalanceItem
