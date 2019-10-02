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
    alignSelf: "flex-start"
  },
  select: {
    fontSize: 18,
    fontWeight: 400
  }
})

interface AssetSelectorProps {
  helperText?: TextFieldProps["helperText"]
  label?: TextFieldProps["label"]
  onChange: (asset: Asset) => void
  trustlines: Horizon.BalanceLine[]
  value: Asset
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
      helperText={props.helperText}
      label={props.label}
      onChange={onChange}
      select
      FormHelperTextProps={{
        className: classes.helperText
      }}
      InputProps={{
        classes: {
          root: classes.input
        }
      }}
      SelectProps={{
        classes: {
          select: classes.select
        },
        disableUnderline: true
      }}
      style={{ flexGrow: 0, flexShrink: 0 }}
      value={stringifyAsset(props.value)}
    >
      <MenuItem value={stringifyAsset(Asset.native())}>XLM</MenuItem>
      {props.trustlines.map(trustline => (
        <MenuItem key={stringifyAsset(trustline)} value={stringifyAsset(trustline)}>
          {trustline.asset_type === "native" ? "XLM" : trustline.asset_code}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default AssetSelector
