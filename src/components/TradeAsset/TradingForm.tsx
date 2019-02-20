import React from "react"
import { useState } from "react"
import { Asset, AssetType, Horizon } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import { useOrderbook } from "../../hooks"
import { calculateSpread } from "../../lib/orderbook"
import { formatBalance } from "../Account/AccountBalances"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { warningColor } from "../../theme"
import Explanation from "./Explanation"
import { useConversionOffers } from "./hooks"

type ToleranceValue = 0 | 0.01 | 0.02

function isDisabled(amount: number, price: number, balance: number) {
  return [Number.isNaN(amount), Number.isNaN(price), amount <= 0, amount > balance, price <= 0].some(
    condition => condition === true
  )
}

const PriceTolerance = (props: { label: string; price: string; tolerance: ToleranceValue }) => (
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

const ReadOnlyTextfield = (props: {
  label: TextFieldProps["label"]
  style?: React.CSSProperties
  value: TextFieldProps["value"]
}) => (
  <TextField label={props.label} style={{ pointerEvents: "none", ...props.style }} tabIndex={-1} value={props.value} />
)

interface TradingFormProps {
  buying: Asset
  buyingBalance: string
  onSetBuying: (assetCode: string) => void
  onSetSelling: (assetCode: string) => void
  selling: Asset
  sellingBalance: string
  testnet: boolean
  trustlines: Array<Horizon.BalanceLineAsset<AssetType.credit4 | AssetType.credit12>>
  DialogActions: React.ComponentType<{ amount: number; disabled?: boolean; price: number }>
}

function TradingForm(props: TradingFormProps) {
  const DialogActions = props.DialogActions
  const tradePair = useOrderbook(props.selling, props.buying, props.testnet)

  const [amountString, setAmountString] = useState("")
  const [tolerance, setTolerance] = useState<ToleranceValue>(0)

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 0 : Number.parseFloat(amountString)
  const { estimatedCost, worstPriceOfBestMatches } = useConversionOffers(tradePair.bids, amount || 0.01)

  const price = worstPriceOfBestMatches || 0
  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)

  const setBuying = (assetCode: string) => {
    if (assetCode === props.selling.getCode() && assetCode !== props.buying.getCode()) {
      // Make buying the selling asset and selling the buying asset
      props.onSetBuying(assetCode)
      props.onSetSelling(props.buying.getCode())
    } else {
      props.onSetBuying(assetCode)
    }
  }
  const setSelling = (assetCode: string) => {
    if (assetCode === props.buying.getCode() && assetCode !== props.selling.getCode()) {
      // Make buying the selling asset and selling the buying asset
      props.onSetSelling(assetCode)
      props.onSetBuying(props.selling.getCode())
    } else {
      props.onSetSelling(assetCode)
    }
  }

  return (
    <VerticalLayout>
      <HorizontalLayout shrink={0} justifyContent="space-between" margin="0 -24px" wrap="wrap">
        <VerticalLayout alignItems="stretch" basis="40%" grow={1} shrink={1} margin="56px 24px 0">
          <HorizontalLayout margin="0 0 24px">
            <TextField
              label="From"
              onChange={event => setSelling(event.target.value)}
              select
              SelectProps={{
                style: { fontWeight: "bold" }
              }}
              style={{ flexGrow: 0, flexShrink: 0, marginRight: 16 }}
              value={props.selling.getCode()}
            >
              <MenuItem value="XLM">XLM</MenuItem>
              {props.trustlines.map(trustline => (
                <MenuItem key={trustline.asset_code} value={trustline.asset_code}>
                  {trustline.asset_code}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              autoFocus
              inputProps={{
                style: { fontWeight: "bold" }
              }}
              label="Amount to spend"
              placeholder={`Max. ${formatBalance(props.sellingBalance)}`}
              onChange={event => setAmountString(event.target.value)}
              style={{ flexGrow: 1, flexShrink: 1 }}
              value={amountString}
            />
          </HorizontalLayout>
          <TextField
            label={`Price per ${props.buying.getCode()}`}
            onChange={event => setTolerance((event.target.value as any) as ToleranceValue)}
            select
            SelectProps={{
              style: { fontWeight: "bold" }
            }}
            style={{ marginBottom: 24 }}
            value={tolerance}
          >
            <MenuItem value={0}>
              <PriceTolerance
                label="Regular"
                price={[
                  worstPriceOfBestMatches
                    ? formatBalance(String(1 / worstPriceOfBestMatches), { groupThousands: false })
                    : "0.00",
                  props.selling.getCode()
                ].join(" ")}
                tolerance={0}
              />
            </MenuItem>
            <MenuItem value={0.01}>
              <PriceTolerance
                label="Fast"
                price={[
                  worstPriceOfBestMatches
                    ? formatBalance(String((1 / worstPriceOfBestMatches) * 1.01), { groupThousands: false })
                    : "0.00",
                  props.selling.getCode()
                ].join(" ")}
                tolerance={0.01}
              />
            </MenuItem>
            <MenuItem value={0.02}>
              <PriceTolerance
                label="Super fast"
                price={[
                  worstPriceOfBestMatches
                    ? formatBalance(String((1 / worstPriceOfBestMatches) * 1.02), { groupThousands: false })
                    : "0.00",
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
              style={{ flexGrow: 0, flexShrink: 0, marginRight: 16 }}
              value={props.buying.getCode()}
            >
              <MenuItem value="XLM">XLM</MenuItem>
              {props.trustlines.map(trustline => (
                <MenuItem key={trustline.asset_code} value={trustline.asset_code}>
                  {trustline.asset_code}
                </MenuItem>
              ))}
            </TextField>
            <ReadOnlyTextfield
              label="Amount to receive"
              style={{ flexGrow: 1, flexShrink: 1, fontWeight: "bold" }}
              value={formatBalance(String(amount ? estimatedCost : 0), { minimumSignificants: 3 })}
            />
          </HorizontalLayout>
          {relativeSpread > 0.01 ? (
            <Box padding="8px 12px" style={{ background: warningColor }}>
              <b>Warning</b>
              <br />
              Large spread ({(relativeSpread * 100).toFixed(1)}
              %) between buying and selling price. Converting the funds back could be expensive.
            </Box>
          ) : null}
          <DialogActions
            amount={amount}
            disabled={amountString === "" || isDisabled(amount, price, Number.parseFloat(props.sellingBalance))}
            price={price}
          />
        </VerticalLayout>
        <VerticalLayout alignItems="stretch" basis="40%" grow={1} shrink={1} margin="16px 24px 0" minWidth={350}>
          <Explanation />
        </VerticalLayout>
      </HorizontalLayout>
    </VerticalLayout>
  )
}

export default TradingForm
