import BigNumber from "big.js"
import React from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { HorizontalLayout } from "../Layout/Box"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalMargin } from "../Layout/Spacing"

type ToleranceValue = 0 | 0.01 | 0.02
type Trustline = Horizon.BalanceLineAsset<AssetType.credit4 | AssetType.credit12>

function AssetSelector(props: { trustlines: Trustline[] } & Pick<TextFieldProps, "label" | "onChange" | "value">) {
  return (
    <TextField
      label={props.label}
      onChange={props.onChange}
      select
      SelectProps={{
        style: { fontWeight: "bold" }
      }}
      style={{ flexGrow: 0, flexShrink: 0 }}
      value={props.value}
    >
      <MenuItem value="XLM">XLM</MenuItem>
      {props.trustlines.map(trustline => (
        <MenuItem key={trustline.asset_code} value={trustline.asset_code}>
          {trustline.asset_code}
        </MenuItem>
      ))}
    </TextField>
  )
}

function PriceTolerance(props: { label: string; price: string; tolerance: ToleranceValue }) {
  return (
    <HorizontalLayout justifyContent="space-between" width="100%">
      <span>{props.price}</span>
      <span style={{ textAlign: "right" }}>
        {props.label}
        {props.tolerance > 0 ? (
          <>
            &nbsp;
            <span style={{ opacity: 0.5 }}>-{props.tolerance * 100}%</span>
          </>
        ) : null}
      </span>
    </HorizontalLayout>
  )
}

type ToleranceSelectorProps = Pick<TextFieldProps, "label" | "onChange" | "value"> & {
  assetCode: string
  price: BigNumber
}

function ToleranceSelector(props: ToleranceSelectorProps) {
  return (
    <TextField
      label={props.label}
      onChange={props.onChange}
      select
      SelectProps={{
        style: { fontWeight: "bold" }
      }}
      style={{ marginBottom: 24 }}
      value={props.value}
    >
      <MenuItem value={0}>
        <PriceTolerance
          label="Regular"
          price={[formatBalance(String(props.price), { groupThousands: false }), props.assetCode].join(" ")}
          tolerance={0}
        />
      </MenuItem>
      <MenuItem value={0.01}>
        <PriceTolerance
          label="Fast"
          price={[formatBalance(String(props.price.mul(1 / 1.01)), { groupThousands: false }), props.assetCode].join(
            " "
          )}
          tolerance={0.01}
        />
      </MenuItem>
      <MenuItem value={0.02}>
        <PriceTolerance
          label="Super fast"
          price={[formatBalance(String(props.price.mul(1 / 1.02)), { groupThousands: false }), props.assetCode].join(
            " "
          )}
          tolerance={0.02}
        />
      </MenuItem>
    </TextField>
  )
}

function ReadOnlyTextfield(props: {
  label: TextFieldProps["label"]
  style?: React.CSSProperties
  value: TextFieldProps["value"]
}) {
  return (
    <TextField
      label={props.label}
      style={{ pointerEvents: "none", ...props.style }}
      tabIndex={-1}
      value={props.value}
    />
  )
}

interface TradePropertiesFormProps {
  amount: string
  buying: Asset
  estimatedReturn: BigNumber
  manualPrice: string
  onSetAmount: (amount: string) => void
  onSetBuying: (assetCode: string) => void
  onSetSelling: (assetCode: string) => void
  onSetManualPrice: (priceString: string) => void
  onSetTolerance: (tolerance: ToleranceValue) => void
  price: BigNumber
  selling: Asset
  sellingBalance: string
  tolerance: ToleranceValue
  trustlines: Trustline[]
}

function TradePropertiesForm(props: TradePropertiesFormProps) {
  const estimatedReturn = (() => {
    if (!props.amount || (props.price.eq(0) && !props.manualPrice)) {
      return BigNumber(0)
    }
    return props.price.eq(0) ? BigNumber(props.amount).div(props.manualPrice) : props.estimatedReturn
  })()

  const setBuying = (newBuyingAssetCode: string) => {
    if (newBuyingAssetCode === props.selling.getCode() && newBuyingAssetCode !== props.buying.getCode()) {
      // Swap buying and selling asset
      props.onSetSelling(props.buying.getCode())
    }
    props.onSetBuying(newBuyingAssetCode)
  }
  const setSelling = (newSellingAssetCode: string) => {
    if (newSellingAssetCode === props.buying.getCode() && newSellingAssetCode !== props.selling.getCode()) {
      // Swap buying and selling asset
      props.onSetBuying(props.selling.getCode())
    }
    props.onSetSelling(newSellingAssetCode)
  }

  return (
    <>
      <HorizontalLayout margin="0 0 24px">
        <AssetSelector
          label="From"
          onChange={event => setSelling(event.target.value)}
          trustlines={props.trustlines}
          value={props.selling.getCode()}
        />
        <HorizontalMargin size={16} />
        <TextField
          autoFocus
          inputProps={{
            style: { fontWeight: "bold" }
          }}
          label="Amount to spend"
          placeholder={`Max. ${formatBalance(props.sellingBalance)}`}
          onChange={event => props.onSetAmount(event.target.value)}
          style={{ flexGrow: 1, flexShrink: 1 }}
          value={props.amount}
        />
      </HorizontalLayout>
      {props.price.eq(0) ? (
        <TextField
          label={`Price per ${props.selling.getCode()}`}
          placeholder="No offers yet. Enter a price manually..."
          onChange={event => props.onSetManualPrice(event.target.value)}
          style={{ marginBottom: 24 }}
          value={props.manualPrice}
          InputProps={{
            endAdornment: (
              <InputAdornment disableTypography position="end" style={{ pointerEvents: "none" }}>
                {props.buying.getCode()}
              </InputAdornment>
            )
          }}
        />
      ) : (
        <ToleranceSelector
          assetCode={props.buying.getCode()}
          label={`Price per ${props.selling.getCode()}`}
          onChange={event => props.onSetTolerance((event.target.value as any) as ToleranceValue)}
          price={props.price}
          value={props.tolerance}
        />
      )}
      <HorizontalLayout margin="0 0 24px">
        <AssetSelector
          label="To"
          onChange={event => setBuying(event.target.value)}
          trustlines={props.trustlines}
          value={props.buying.getCode()}
        />
        <HorizontalMargin size={16} />
        <ReadOnlyTextfield
          label="Amount to receive"
          style={{ flexGrow: 1, flexShrink: 1, fontWeight: "bold" }}
          value={formatBalance(String(estimatedReturn), { minimumSignificants: 3 })}
        />
      </HorizontalLayout>
    </>
  )
}

export default TradePropertiesForm
