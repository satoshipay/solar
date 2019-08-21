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

    "@media (hover: hover)": {
      "&:hover": {
        background: "rgba(255, 255, 255, 0.05)"
      }
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

    [breakpoints.down(600)]: props.horizontal
      ? {
          width: 40,
          height: 40
        }
      : {},
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

function BalanceItem(props: BalanceWithLogoProps, ref: React.Ref<any>) {
  const classes = useBalanceItemStyles(props)
  const lastMouseDown = React.useRef({ mouseX: 0, mouseY: 0 })

  const handleMouseClick = React.useCallback(
    (event: React.MouseEvent) => {
      const epsilonX = Math.abs(lastMouseDown.current.mouseX - event.clientX)
      const epsilonY = Math.abs(lastMouseDown.current.mouseY - event.clientY)

      // Prevent click event handler being triggered on swipe
      if (props.onClick && epsilonX < 20 && epsilonY < 20) {
        props.onClick()
      }
    },
    [props.onClick]
  )

  const handleMouseDown = React.useCallback((event: React.MouseEvent) => {
    lastMouseDown.current.mouseX = event.clientX
    lastMouseDown.current.mouseY = event.clientY
  }, [])

  return (
    <div
      className={`${classes.root} ${props.onClick ? classes.clickable : ""}`}
      onClick={handleMouseClick}
      onMouseDown={handleMouseDown}
      ref={ref}
    >
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

export default React.forwardRef(BalanceItem)
