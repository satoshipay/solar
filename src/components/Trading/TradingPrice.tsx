import BigNumber from "big.js"
import React from "react"
import ContentEditable, { ContentEditableEvent } from "react-contenteditable"
import { Asset } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import TextField from "@material-ui/core/TextField"
import { fade, makeStyles } from "@material-ui/core/styles"
import theme, { breakpoints } from "../../theme"

interface TradingPriceProps {
  inputError?: Error
  manualPrice?: string
  onBlur?: () => void
  onChange: (priceString: string) => void
  onSetPriceDenotedIn: (denotedIn: "primary" | "secondary") => void
  price: BigNumber
  priceDenotedIn: "primary" | "secondary"
  primaryAsset: Asset | undefined
  secondaryAsset: Asset | undefined
  style?: React.CSSProperties
}

function TradingPrice(props: TradingPriceProps) {
  const isDisabled = !props.primaryAsset || !props.secondaryAsset

  const endAdornment = (
    <InputAdornment position="end">
      <Select
        disabled={isDisabled}
        disableUnderline
        onChange={event => props.onSetPriceDenotedIn(event.target.value as any)}
        style={{ fontWeight: 400 }}
        value={props.priceDenotedIn}
      >
        <MenuItem selected={props.priceDenotedIn === "secondary"} value="secondary">
          {props.secondaryAsset ? props.secondaryAsset.getCode() : ""}
        </MenuItem>
        <MenuItem selected={props.priceDenotedIn === "primary"} value="primary">
          {props.primaryAsset ? props.primaryAsset.getCode() : ""}
        </MenuItem>
      </Select>
    </InputAdornment>
  )

  return (
    <TextField
      inputProps={{
        min: "0.0000001"
      }}
      InputProps={{ endAdornment }}
      error={Boolean(props.inputError)}
      label={props.inputError ? props.inputError.message : "Limit price"}
      onBlur={props.onBlur}
      onChange={event => props.onChange(event.target.value)}
      style={props.style}
      type="number"
      value={props.manualPrice}
    />
  )
}

export default React.memo(TradingPrice)
