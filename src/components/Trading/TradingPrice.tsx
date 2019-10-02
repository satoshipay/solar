import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import InputBase from "@material-ui/core/InputBase"
import { fade } from "@material-ui/core/styles"
import { makeStyles } from "@material-ui/core/styles"
import CheckIcon from "@material-ui/icons/Check"
import ClearIcon from "@material-ui/icons/Clear"
import EditIcon from "@material-ui/icons/Edit"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import theme, { breakpoints } from "../../theme"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalLayout } from "../Layout/Box"

const useTradingPriceStyles = makeStyles({
  root: {
    border: `1px solid ${theme.palette.action.disabled}`,
    borderRadius: theme.shape.borderRadius,
    boxSizing: "content-box !important" as any,
    color: theme.palette.primary.dark,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    height: 24,
    padding: "8px 16px",
    whiteSpace: "nowrap",

    [breakpoints.down(400)]: {
      paddingLeft: 12,
      paddingRight: 12
    }
  },
  action: {
    color: theme.palette.primary.dark,
    fontSize: 16,
    margin: -8,
    padding: 4
  },
  primaryAction: {
    background: fade(theme.palette.primary.dark, 0.75),
    color: "white",
    padding: 2,

    "&:hover": {
      background: fade(theme.palette.primary.dark, 0.8)
    }
  },
  input: {
    height: 16,
    paddingTop: 2,
    paddingBottom: 2,
    textAlign: "right"
  },
  inputRoot: {
    color: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    marginRight: 8,
    verticalAlign: "bottom"
  }
})

interface DisplayPriceProps {
  buying: Asset
  editing: boolean
  inputError?: Error
  onChange: (value: string) => void
  price: BigNumber
  selling: Asset
  value?: string
  variant: "fixed-buying" | "fixed-selling"
}

function DisplayPrice(props: DisplayPriceProps) {
  const classes = useTradingPriceStyles({})

  const assetLeft = props.variant === "fixed-buying" ? props.buying : props.selling
  const assetRight = props.variant === "fixed-buying" ? props.selling : props.buying
  const price = props.variant === "fixed-buying" ? BigNumber(1).div(props.price) : props.price

  if (props.editing) {
    return (
      <span>
        1&nbsp;{assetLeft.getCode()}
        &nbsp;&nbsp;=&nbsp;&nbsp;
        <InputBase
          autoFocus={process.env.PLATFORM !== "ios"}
          classes={{
            root: classes.inputRoot,
            input: classes.input
          }}
          error={Boolean(props.inputError)}
          inputProps={{
            size: 10
          }}
          onChange={event => props.onChange(event.target.value)}
          value={props.value}
        />
        {assetRight.getCode()}
      </span>
    )
  } else {
    return (
      <span>
        1&nbsp;{assetLeft.getCode()}
        &nbsp;&nbsp;=&nbsp;&nbsp;
        {formatBalance(price, { maximumSignificants: 7 })}
        &nbsp;
        {assetRight.getCode()}
      </span>
    )
  }
}

interface TradingPriceProps {
  buying: Asset
  inputError?: Error
  isEditingPrice: boolean
  isPriceSwitched?: boolean
  manualPrice?: string
  onApplyManualPrice: () => void
  onDismissManualPrice: () => void
  onSetManualPrice: (priceString: string) => void
  onSwitchPriceAssets: () => void
  onEditPrice: () => void
  price: BigNumber
  selling: Asset
}

function TradingPrice(props: TradingPriceProps) {
  const classes = useTradingPriceStyles({})

  const actionsLeft = props.isEditingPrice ? null : (
    <IconButton
      className={classes.action}
      color="primary"
      onClick={props.onSwitchPriceAssets}
      size="small"
      style={{ marginRight: 8 }}
    >
      <SwapHorizIcon />
    </IconButton>
  )
  const actionsRight = props.isEditingPrice ? (
    <>
      <IconButton
        className={classes.action}
        color="primary"
        onClick={props.onDismissManualPrice}
        size="small"
        style={{ marginLeft: 4, marginRight: 12 }}
      >
        <ClearIcon />
      </IconButton>
      <IconButton
        className={`${classes.action} ${classes.primaryAction}`}
        color="primary"
        onClick={props.onApplyManualPrice}
        size="small"
        style={{ marginRight: -2 }}
      >
        <CheckIcon />
      </IconButton>
    </>
  ) : (
    <IconButton
      className={`${classes.action} ${classes.primaryAction}`}
      color="primary"
      onClick={props.onEditPrice}
      size="small"
      style={{ marginLeft: 16, marginRight: -2 }}
    >
      <EditIcon style={{ transform: "scale(0.75)" }} />
    </IconButton>
  )

  return (
    <HorizontalLayout alignItems="center" className={classes.root}>
      {actionsLeft}
      &nbsp;
      <DisplayPrice
        {...props}
        editing={props.isEditingPrice}
        onChange={props.onSetManualPrice}
        value={props.manualPrice}
        variant={props.isPriceSwitched ? "fixed-buying" : "fixed-selling"}
      />
      &nbsp;
      {actionsRight}
    </HorizontalLayout>
  )
}

export default React.memo(TradingPrice)
