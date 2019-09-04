import BigNumber from "big.js"
import React from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { balancelineToAsset, stringifyAsset } from "../../lib/stellar"
import { formatBalance } from "../Account/AccountBalances"
import { PriceInput, ReadOnlyTextfield } from "../Form/FormFields"
import { HorizontalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"

type ToleranceValue = 0 | 0.01 | 0.02
type Trustline = Horizon.BalanceLineAsset<AssetType.credit4 | AssetType.credit12>

interface AssetSelectorProps {
  label: TextFieldProps["label"]
  onChange: (asset: Asset) => void
  trustlines: Trustline[]
  value: Asset
}

function AssetSelector(props: AssetSelectorProps) {
  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
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
      label={props.label}
      onChange={onChange}
      select
      style={{ flexGrow: 0, flexShrink: 0 }}
      value={stringifyAsset(props.value)}
    >
      <MenuItem value={stringifyAsset(Asset.native())}>XLM</MenuItem>
      {props.trustlines.map(trustline => (
        <MenuItem key={stringifyAsset(trustline)} value={stringifyAsset(trustline)}>
          {trustline.asset_code}
        </MenuItem>
      ))}
    </TextField>
  )
}

interface TradePropertiesFormProps {
  amount: string
  bestPrice: BigNumber | undefined
  buying: Asset
  estimatedReturn: BigNumber
  manualPrice: string | undefined
  onSetAmount: (amount: string) => void
  onSetBuying: (asset: Asset) => void
  onSetSelling: (asset: Asset) => void
  onSetManualPrice: (priceString: string) => void
  onSetTolerance: (tolerance: ToleranceValue) => void
  selling: Asset
  sellingBalance: string
  tolerance: ToleranceValue
  trustlines: Trustline[]
}

function TradePropertiesForm(props: TradePropertiesFormProps) {
  const estimatedReturn = (() => {
    if (!props.amount) {
      return BigNumber(0)
    }
    return props.manualPrice ? BigNumber(props.amount).mul(props.manualPrice) : props.estimatedReturn
  })()

  const setBuying = (newBuyingAsset: Asset) => {
    if (newBuyingAsset.equals(props.selling) && !newBuyingAsset.equals(props.buying)) {
      // Swap buying and selling asset
      props.onSetSelling(props.buying)
    }
    props.onSetBuying(newBuyingAsset)
  }
  const setSelling = (newSellingAsset: Asset) => {
    if (newSellingAsset.equals(props.buying) && !newSellingAsset.equals(props.selling)) {
      // Swap buying and selling asset
      props.onSetBuying(props.selling)
    }
    props.onSetSelling(newSellingAsset)
  }

  return (
    <>
      <HorizontalLayout margin="0 0 24px">
        <AssetSelector label="From" onChange={setSelling} trustlines={props.trustlines} value={props.selling} />
        <HorizontalMargin size={16} />
        <TextField
          autoFocus={process.env.PLATFORM !== "ios"}
          inputProps={{
            style: { height: 27 }
          }}
          label="Amount to spend"
          placeholder={`Max. ${formatBalance(props.sellingBalance)}`}
          onChange={event => props.onSetAmount(event.target.value)}
          type="number"
          style={{ flexGrow: 1, flexShrink: 1 }}
          value={props.amount}
        />
      </HorizontalLayout>
      <PriceInput
        assetCode={props.buying.getCode()}
        assetStyle={{ fontWeight: "bold" }}
        inputProps={{
          style: { height: 27 }
        }}
        label={`Price per ${props.selling.getCode()}`}
        placeholder={props.bestPrice ? `${props.bestPrice.toFixed()} ${props.buying.getCode()}` : "No offers yet"}
        onChange={event => props.onSetManualPrice(event.target.value)}
        style={{ marginBottom: 24 }}
        value={props.manualPrice || (props.bestPrice ? props.bestPrice.toFixed() : "")}
      />
      <HorizontalLayout margin="0 0 24px">
        <AssetSelector label="To" onChange={setBuying} trustlines={props.trustlines} value={props.buying} />
        <HorizontalMargin size={16} />
        <ReadOnlyTextfield
          disableUnderline
          inputProps={{
            style: {
              cursor: "default",
              height: 27
            }
          }}
          label="Amount to receive"
          style={{ flexGrow: 1, flexShrink: 1, fontWeight: "bold" }}
          value={formatBalance(String(estimatedReturn), { minimumSignificants: 3 })}
        />
      </HorizontalLayout>
    </>
  )
}

export default React.memo(TradePropertiesForm)
