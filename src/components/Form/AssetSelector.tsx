import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { makeStyles } from "@material-ui/core/styles"
import { balancelineToAsset, stringifyAsset } from "../../lib/stellar"
import AssetLogo from "../AccountAssets/AssetLogo"

const useAssetItemStyles = makeStyles(theme => ({
  icon: {
    [theme.breakpoints.up(600)]: {
      minWidth: 48
    }
  },
  logo: {
    width: 32,
    height: 32,

    [theme.breakpoints.up(600)]: {
      width: 28,
      height: 28
    }
  }
}))

interface AssetItemProps {
  asset: Asset
  testnet: boolean
}

const AssetItem = React.memo(
  React.forwardRef(function AssetItem(props: AssetItemProps, ref: React.Ref<HTMLLIElement>) {
    const classes = useAssetItemStyles()
    const { testnet, ...reducedProps } = props

    return (
      <MenuItem {...reducedProps} ref={ref} value={stringifyAsset(props.asset)}>
        <ListItemIcon className={classes.icon}>
          <AssetLogo asset={props.asset} className={classes.logo} testnet={props.testnet} />
        </ListItemIcon>
        <ListItemText>{props.asset.getCode()}</ListItemText>
      </MenuItem>
    )
  })
)

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
  testnet: boolean
  trustlines: Horizon.BalanceLine[]
  value?: Asset
}

function AssetSelector(props: AssetSelectorProps) {
  const classes = useAssetSelectorStyles()

  const onChange = React.useCallback(
    (event: React.ChangeEvent<{ name?: any; value: any }>, child: React.ComponentElement<AssetItemProps, any>) => {
      const assets = [Asset.native(), ...props.trustlines.map(balancelineToAsset)]

      const matchingAsset = assets.find(asset => asset.equals(child.props.asset))

      if (matchingAsset) {
        props.onChange(matchingAsset)
      } else {
        // tslint:disable-next-line no-console
        console.error(
          `Invariant violation: Trustline ${child.props.asset.getCode()} selected, but no matching asset found.`
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
      onChange={onChange as any}
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
      <AssetItem asset={Asset.native()} testnet={props.testnet} />
      {props.trustlines
        .filter(trustline => trustline.asset_type !== "native")
        .map(trustline => (
          <AssetItem asset={balancelineToAsset(trustline)} key={stringifyAsset(trustline)} testnet={props.testnet} />
        ))}
    </TextField>
  )
}

export default React.memo(AssetSelector)
