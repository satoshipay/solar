import { Horizon } from "stellar-sdk"
import React from "react"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { balancelineToAsset } from "../../Generic/lib/stellar"
import { breakpoints } from "../../App/theme"
import { SingleBalance } from "../../Account/components/AccountBalances"
import AssetLogo from "./AssetLogo"

export function getBalanceItemMinMaxWidth() {
  if (window.innerWidth < 350) {
    return [90, 90 * 1.5]
  } else if (window.innerWidth < 600) {
    return [100, 100 * 1.5]
  } else {
    return [130, 130 * 1.5]
  }
}

const useBalanceItemStyles = makeStyles({
  root: {
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    justifyContent: "flex-start",
    minWidth: 130,
    opacity: 0.9,
    padding: "8px 16px",

    [breakpoints.down(600)]: {
      minWidth: 100
    },
    [breakpoints.down(350)]: {
      minWidth: 90
    }
  },
  compact: {
    minWidth: 100,

    [breakpoints.down(600)]: {
      minWidth: 90
    },
    [breakpoints.down(350)]: {
      minWidth: 80
    }
  },
  clickable: {
    borderRadius: 6,
    cursor: "pointer",
    opacity: 1,

    "@media (hover: hover)": {
      "&:hover": {
        background: "rgba(255, 255, 255, 0.05)"
      }
    }
  },
  logo: {
    boxShadow: "0 0 2px #fff",
    boxSizing: "border-box",
    margin: 0,
    marginLeft: 0,
    marginRight: 16,
    pointerEvents: "none", // images are handled differently by web views
    width: 40,
    height: 40,

    [breakpoints.down(400)]: {
      width: 36,
      height: 36
    },

    "$compact &": {
      fontSize: 8,
      marginRight: 10,
      width: 24,
      height: 24
    }
  },
  balance: {
    fontSize: 16,
    lineHeight: "20px",
    marginTop: 0,
    textAlign: "left",

    [breakpoints.down(600)]: {
      fontSize: 14,
      lineHeight: "18px"
    },

    "$compact &": {
      fontSize: 16
    },

    "$compact & span": {
      fontWeight: "300 !important" as any,
      opacity: "1 !important" as any
    }
  },
  assetCode: {
    display: "block",
    fontWeight: 700,

    "$compact &": {
      display: "none"
    }
  }
})

interface BalanceItemProps {
  balance: Horizon.BalanceLine
  compact?: boolean
  onClick?: () => void
  testnet: boolean
}

function BalanceItem(props: BalanceItemProps, ref: React.Ref<any>) {
  const classes = useBalanceItemStyles()
  const asset = React.useMemo(() => balancelineToAsset(props.balance), [props.balance])

  return (
    <div
      className={`${classes.root} ${props.compact ? classes.compact : ""} ${props.onClick ? classes.clickable : ""}`}
      onClick={props.onClick}
      ref={ref}
    >
      <AssetLogo asset={asset} className={classes.logo} testnet={props.testnet} />
      <div className={classes.balance}>
        <span className={classes.assetCode}>
          {props.balance.asset_type === "native" ? "XLM" : props.balance.asset_code}
        </span>
        <SingleBalance assetCode="" balance={props.balance.balance} inline />
      </div>
    </div>
  )
}

export default React.memo(React.forwardRef(BalanceItem))
