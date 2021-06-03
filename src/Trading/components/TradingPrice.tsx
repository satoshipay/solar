import React from "react"
import { useTranslation } from "react-i18next"
import { Asset } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import TextField from "@material-ui/core/TextField"

interface TradingPriceProps {
  defaultPrice?: string
  inputError?: string
  manualPrice?: string
  onBlur?: () => void
  onChange?: (event: React.ChangeEvent) => void
  onSetPriceDenotedIn: (denotedIn: "primary" | "secondary") => void
  priceDenotedIn: "primary" | "secondary"
  primaryAsset: Asset | undefined
  secondaryAsset: Asset | undefined
  selectOnFocus?: boolean
  style?: React.CSSProperties
}

const TradingPrice = React.forwardRef(function TradingPrice(props: TradingPriceProps, ref: React.Ref<HTMLDivElement>) {
  const isDisabled = !props.primaryAsset || !props.secondaryAsset
  const { t } = useTranslation()

  const priceUnit = props.priceDenotedIn === "primary" ? props.secondaryAsset?.getCode() : props.primaryAsset?.getCode()

  const label = priceUnit
    ? t("trading.trading-price.label", { unit: priceUnit })
    : t("trading.trading-price.default-label")

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
        pattern: "^[0-9]*(.[0-9]+)?$",
        inputMode: "decimal",
        min: "0.0000001"
      }}
      InputProps={{ endAdornment }}
      inputRef={ref}
      error={Boolean(props.inputError)}
      label={props.inputError || label}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onFocus={props.selectOnFocus ? event => event.target.select() : undefined}
      style={props.style}
      value={props.defaultPrice ? props.defaultPrice : props.manualPrice}
    />
  )
})

export default React.memo(TradingPrice)
