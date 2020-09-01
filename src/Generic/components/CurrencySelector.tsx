import React from "react"
import { useTranslation } from "react-i18next"
import { Asset } from "stellar-sdk"
import Divider from "@material-ui/core/Divider"
import ListItemText from "@material-ui/core/ListItemText"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { makeStyles } from "@material-ui/core/styles"
import { CurrencyCode, CurrencyCodes } from "~Generic/lib/currency-conversion"
import { stringifyAsset } from "~Generic/lib/stellar"
import { AssetItem, AssetItemProps } from "./AssetSelector"

interface CurrencyItemProps {
  currency: CurrencyCode
  disabled?: boolean
  testnet: boolean
  // key + value props are expected here from React/Material-ui validation mechanisms
  key: string
  value: string
}

const CurrencyItem = React.memo(
  React.forwardRef(function CurrencyItem(props: CurrencyItemProps, ref: React.Ref<HTMLLIElement>) {
    const { testnet, ...reducedProps } = props

    return (
      <MenuItem {...reducedProps} key={props.key} ref={ref} value={props.value}>
        <ListItemText>{props.currency}</ListItemText>
      </MenuItem>
    )
  })
)

const useCurrencySelectorStyles = makeStyles({
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

interface CurrencySelectorProps {
  autoFocus?: TextFieldProps["autoFocus"]
  asset?: Asset
  currencies?: CurrencyCode[]
  children?: React.ReactNode
  className?: string
  disableUnderline?: boolean
  helperText?: TextFieldProps["helperText"]
  inputError?: string
  label?: TextFieldProps["label"]
  margin?: TextFieldProps["margin"]
  minWidth?: number | string
  name?: string
  onChange?: (value: CurrencyCode | Asset) => void
  style?: React.CSSProperties
  testnet: boolean
  value?: Asset | CurrencyCode
}

function CurrencySelector(props: CurrencySelectorProps) {
  const { asset, onChange } = props
  const classes = useCurrencySelectorStyles()
  const { t } = useTranslation()

  const currencies = props.currencies
    ? props.currencies
    : (Object.keys(CurrencyCodes)
        .filter((key: any) => !isNaN(Number(CurrencyCodes[key])))
        .sort() as CurrencyCode[])

  const handleChange = React.useCallback(
    (_, child: React.ComponentElement<CurrencyItemProps & AssetItemProps, any>) => {
      if (onChange) {
        if (child.props.asset) {
          onChange(child.props.asset)
        } else if (child.props.currency) {
          onChange(child.props.currency)
        }
      }
    },
    [onChange]
  )

  const value = React.useMemo(
    () => (props.value ? (props.value instanceof Asset ? stringifyAsset(props.value) : props.value) : ""),
    [props.value]
  )

  const items = React.useMemo(() => {
    const array: React.ReactNode[] = []
    if (!props.value) {
      array.push(
        <MenuItem disabled key="placeholder" value="">
          {t("generic.currency-selector.placeholder")}
        </MenuItem>
      )
    }
    if (asset) {
      array.push(
        <AssetItem asset={asset} key={stringifyAsset(asset)} testnet={props.testnet} value={stringifyAsset(asset)} />
      )
      array.push(<Divider key="divider" />)
    }
    array.push(
      currencies.map(currency => (
        <CurrencyItem currency={currency} key={currency} testnet={props.testnet} value={currency} />
      ))
    )
    return array
  }, [asset, currencies, props.testnet, props.value, t])

  return (
    <TextField
      autoFocus={props.autoFocus}
      className={props.className}
      error={Boolean(props.inputError)}
      helperText={props.helperText}
      label={props.inputError ? props.inputError : props.label}
      margin={props.margin}
      onChange={handleChange as any}
      name={props.name}
      placeholder={t("generic.currency-selector.placeholder")}
      select
      style={{ flexShrink: 0, ...props.style }}
      value={value}
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
        displayEmpty: !props.value,
        disableUnderline: props.disableUnderline,
        renderValue: () =>
          props.value
            ? props.value instanceof Asset
              ? props.value.getCode()
              : props.value
            : t("generic.currency-selector.render-value")
      }}
    >
      {items}
    </TextField>
  )
}

export default React.memo(CurrencySelector)
