import BigNumber from "big.js"
import React from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { HorizontalLayout } from "../Layout/Box"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalMargin } from "../Layout/Spacing"

type ToleranceValue = 0 | 0.01 | 0.02

function PriceTolerance(props: { label: string; price: string; tolerance: ToleranceValue }) {
  return (
    <HorizontalLayout justifyContent="space-between" width="100%">
      <span>{props.price}</span>
      <span style={{ textAlign: "right" }}>
        {props.label}
        {props.tolerance > 0 ? (
          <>
            &nbsp;
            <span style={{ opacity: 0.5 }}>+{props.tolerance * 100}%</span>
          </>
        ) : null}
      </span>
    </HorizontalLayout>
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
  estimatedCost: number
  onSetAmount: (amount: string) => void
  onSetBuying: (assetCode: string) => void
  onSetSelling: (assetCode: string) => void
  onSetTolerance: (tolerance: ToleranceValue) => void
  price: BigNumber
  selling: Asset
  sellingBalance: string
  tolerance: ToleranceValue
  trustlines: Array<Horizon.BalanceLineAsset<AssetType.credit4 | AssetType.credit12>>
}

function TradePropertiesForm(props: TradePropertiesFormProps) {
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
        <TextField
          label="From"
          onChange={event => setSelling(event.target.value)}
          select
          SelectProps={{
            style: { fontWeight: "bold" }
          }}
          style={{ flexGrow: 0, flexShrink: 0 }}
          value={props.selling.getCode()}
        >
          <MenuItem value="XLM">XLM</MenuItem>
          {props.trustlines.map(trustline => (
            <MenuItem key={trustline.asset_code} value={trustline.asset_code}>
              {trustline.asset_code}
            </MenuItem>
          ))}
        </TextField>
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
      <TextField
        label={`Price per ${props.buying.getCode()}`}
        onChange={event => props.onSetTolerance((event.target.value as any) as ToleranceValue)}
        select
        SelectProps={{
          style: { fontWeight: "bold" }
        }}
        style={{ marginBottom: 24 }}
        value={props.tolerance}
      >
        <MenuItem value={0}>
          <PriceTolerance
            label="Regular"
            price={[formatBalance(String(props.price), { groupThousands: false }), props.selling.getCode()].join(" ")}
            tolerance={0}
          />
        </MenuItem>
        <MenuItem value={0.01}>
          <PriceTolerance
            label="Fast"
            price={[
              formatBalance(String(props.price.mul(1.01)), { groupThousands: false }),
              props.selling.getCode()
            ].join(" ")}
            tolerance={0.01}
          />
        </MenuItem>
        <MenuItem value={0.02}>
          <PriceTolerance
            label="Super fast"
            price={[
              formatBalance(String(props.price.mul(1.02)), { groupThousands: false }),
              props.selling.getCode()
            ].join(" ")}
            tolerance={0.02}
          />
        </MenuItem>
      </TextField>
      <HorizontalLayout margin="0 0 24px">
        <TextField
          label="To"
          onChange={event => setBuying(event.target.value)}
          select
          SelectProps={{
            style: { fontWeight: "bold" }
          }}
          style={{ flexGrow: 0, flexShrink: 0 }}
          value={props.buying.getCode()}
        >
          <MenuItem value="XLM">XLM</MenuItem>
          {props.trustlines.map(trustline => (
            <MenuItem key={trustline.asset_code} value={trustline.asset_code}>
              {trustline.asset_code}
            </MenuItem>
          ))}
        </TextField>
        <HorizontalMargin size={16} />
        <ReadOnlyTextfield
          label="Amount to receive"
          style={{ flexGrow: 1, flexShrink: 1, fontWeight: "bold" }}
          value={formatBalance(String(props.estimatedCost), { minimumSignificants: 3 })}
        />
      </HorizontalLayout>
    </>
  )
}

export default TradePropertiesForm
