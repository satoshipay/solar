import BigNumber from "big.js"
import React from "react"
import ContentEditable, { ContentEditableEvent } from "react-contenteditable"
import { Asset } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import { fade, makeStyles } from "@material-ui/core/styles"
import EditIcon from "@material-ui/icons/Edit"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import theme, { breakpoints } from "../../theme"
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
    padding: "8px 24px",
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
  error: {
    color: theme.palette.error.main
  },
  input: {
    position: "relative",

    "&:focus": {
      outline: "none"
    },
    "&:before": {
      content: "' '",
      position: "absolute",
      bottom: -1,
      left: 0,
      right: 0,
      borderBottom: `1px solid ${fade(theme.palette.primary.dark, 0.5)}`
    },
    "&$error:before, &$error:after": {
      borderBottomColor: theme.palette.error.main
    },
    "&:after": {
      transition: `border-bottom ${theme.transitions.duration.shorter}ms, transform ${theme.transitions.duration.shorter}ms`
    },
    "&:not($error):after": {
      content: "' '",
      position: "absolute",
      bottom: -1,
      left: 0,
      right: 0,
      borderBottom: `2px solid ${theme.palette.primary.dark}`,
      transform: "scaleX(0)"
    },
    "&:focus:not($error):after": {
      transform: "scaleX(1)"
    }
  },
  inputContainer: {
    cursor: "pointer",
    flexShrink: 0
  }
})

interface DisplayPriceProps {
  buying: Asset
  inputError?: Error
  inputRef?: React.RefObject<HTMLElement>
  onBlur?: () => void
  onChange: (value: string) => void
  onClick: () => void
  price: BigNumber
  selling: Asset
  value?: string
  variant: "fixed-buying" | "fixed-selling"
}

function DisplayPrice(props: DisplayPriceProps) {
  const classes = useTradingPriceStyles({})

  const assetLeft = props.variant === "fixed-buying" ? props.buying : props.selling
  const assetRight = props.variant === "fixed-buying" ? props.selling : props.buying

  const handleEdit = React.useCallback(
    (event: ContentEditableEvent) => {
      props.onChange(event.target.value)
    },
    [props.onChange]
  )

  return (
    <span className={classes.inputContainer} onClick={props.onClick}>
      1&nbsp;{assetLeft.getCode()}
      &nbsp;&nbsp;=&nbsp;&nbsp;
      <ContentEditable
        className={`${classes.input} ${props.inputError ? classes.error : ""}`}
        html={props.value || ""}
        innerRef={props.inputRef}
        onBlur={props.onBlur}
        onChange={handleEdit}
        tagName="span"
      />
      &nbsp;
      {assetRight.getCode()}
    </span>
  )
}

interface TradingPriceProps {
  buying: Asset
  inputError?: Error
  inputRef?: React.RefObject<HTMLElement>
  manualPrice?: string
  onBlur?: () => void
  onChange: (priceString: string) => void
  onEditClick: () => void
  onSwitchPriceAssets: () => void
  price: BigNumber
  selling: Asset
  variant: "fixed-buying" | "fixed-selling"
}

function TradingPrice(props: TradingPriceProps) {
  const classes = useTradingPriceStyles({})

  const actionsLeft = (
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
  const actionsRight = (
    <IconButton
      className={classes.action}
      color="primary"
      onClick={props.onEditClick}
      size="small"
      style={{ marginLeft: 8 }}
    >
      <EditIcon style={{ transform: "scale(0.75)" }} />
    </IconButton>
  )

  return (
    <HorizontalLayout alignItems="center" className={classes.root}>
      {actionsLeft}
      <DisplayPrice {...props} onClick={props.onEditClick} value={props.manualPrice} />
      {actionsRight}
    </HorizontalLayout>
  )
}

export default React.memo(TradingPrice)
