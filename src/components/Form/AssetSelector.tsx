import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { makeStyles } from "@material-ui/core/styles"
import { balancelineToAsset, stringifyAsset } from "../../lib/stellar"

const useAssetSelectorStyles = makeStyles({
  helperText: {
    maxWidth: 100,
    whiteSpace: "nowrap"
  },
  input: {
    minWidth: 72
  },
  select: {
    fontSize: 18,
    fontWeight: 400
  },
  unselected: {
    opacity: 0.5
  }
})

interface AssetSelectorProps {
  autoFocus?: TextFieldProps["autoFocus"]
  disableUnderline?: boolean
  helperText?: TextFieldProps["helperText"]
  label?: TextFieldProps["label"]
  minWidth?: number | string
  onChange: (asset: Asset) => void
  style?: React.CSSProperties
  trustlines: Horizon.BalanceLine[]
  value?: Asset
}

function AssetSelector(props: AssetSelectorProps) {
  const classes = useAssetSelectorStyles()

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const assets = [Asset.native(), ...props.trustlines.map(balancelineToAsset)]

      const matchingAsset = assets.find(asset => stringifyAsset(asset) === event.target.value)

      if (matchingAsset) {
        props.onChange(matchingAsset)
      } else {
        // tslint:disable-next-line no-console
        console.error(
          `Invariant violation: Trustline with value ${event.target.value} selected, but no matching asset found.`
        )
      }
    },
    [props.onChange, props.trustlines]
  )

  return (
    <TextField
      autoFocus={props.autoFocus}
      helperText={props.helperText}
      label={props.label}
      onChange={onChange}
      placeholder="Select an asset"
      select
      style={{ flexShrink: 0, ...props.style }}
      value={props.value ? stringifyAsset(props.value) : ""}
      FormHelperTextProps={{
        className: classes.helperText
      }}
      InputProps={{
        classes: {
          root: classes.input
        },
        style: {
          minWidth: props.minWidth
        }
      }}
      SelectProps={{
        classes: {
          root: props.value ? undefined : classes.unselected,
          select: classes.select
        },
        disableUnderline: props.disableUnderline,
        displayEmpty: props.value === undefined,
        renderValue: () => (props.value ? props.value.getCode() : "Select")
      }}
    >
      {props.value ? null : (
        <MenuItem disabled value="">
          Select an asset
        </MenuItem>
      )}
      <MenuItem value={stringifyAsset(Asset.native())}>XLM</MenuItem>
      {props.trustlines
        .filter(trustline => trustline.asset_type !== "native")
        .map(trustline => (
          <MenuItem key={stringifyAsset(trustline)} value={stringifyAsset(trustline)}>
            {trustline.asset_type === "native" ? "XLM" : trustline.asset_code}
          </MenuItem>
        ))}
    </TextField>
  )
}

export default AssetSelector
