import React from "react"
import { useState } from "react"
import { Asset } from "stellar-sdk"
import grey from "@material-ui/core/colors/grey"
import InputAdornment from "@material-ui/core/InputAdornment"
import MenuItem from "@material-ui/core/MenuItem"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import { useOrderbook } from "../../hooks"
import { formatBalance } from "../Account/AccountBalances"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { useConversionOffers } from "./hooks"

type ToleranceValue = 0 | 0.01 | 0.02

const AssetCodeAdornment = (props: { children: string }) => (
  <InputAdornment disableTypography position="end" style={{ pointerEvents: "none" }}>
    <Typography color="textPrimary" style={{ fontSize: "100%", lineHeight: "100%" }}>
      {props.children}
    </Typography>
  </InputAdornment>
)

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

interface TradingTabProps {
  action: "buy" | "sell"
  asset: Asset
  testnet: boolean
  tokenBalance: string
  xlmBalance: string
  DialogActions: React.ComponentType<{ amount: number; disabled?: boolean; price: number }>
}

function TradingTab(props: TradingTabProps) {
  const DialogActions = props.DialogActions
  const assetCode = props.asset ? props.asset.code : ""

  const tradePair =
    props.action === "buy"
      ? useOrderbook(Asset.native(), props.asset, props.testnet)
      : useOrderbook(props.asset, Asset.native(), props.testnet)
  const [amountString, setAmountString] = useState("")
  const [tolerance, setTolerance] = useState<ToleranceValue>(0)

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 0 : Number.parseFloat(amountString)

  const { estimatedCost, worstPriceOfBestMatches } = useConversionOffers(tradePair, amount, Number.NaN)
  const price = worstPriceOfBestMatches || 0

  return (
    <VerticalLayout padding="16px 0">
      <HorizontalLayout minHeight="100%">
        <VerticalLayout alignItems="stretch" grow={1} shrink={1}>
          <TextField
            InputProps={{
              endAdornment: <AssetCodeAdornment>{props.action === "buy" ? "XLM" : assetCode}</AssetCodeAdornment>,
              style: {
                minWidth: "15em"
              }
            }}
            autoFocus
            label="Amount to convert"
            placeholder={`Max. ${formatBalance(props.action === "buy" ? props.xlmBalance : props.tokenBalance)}`}
            onChange={event => setAmountString(event.target.value)}
            style={{ flexGrow: 1, flexShrink: 0 }}
            value={amountString}
          />
          <TextField
            label="Price"
            onChange={event => setTolerance((event.target.value as any) as ToleranceValue)}
            select
            style={{ flexGrow: 1, flexShrink: 0 }}
            value={tolerance}
          >
            <MenuItem value={0}>
              <PriceTolerance
                label="Regular"
                price={[
                  worstPriceOfBestMatches
                    ? formatBalance(String(1 / worstPriceOfBestMatches), { groupThousands: false })
                    : "0.00",
                  props.action === "buy" ? "XLM" : assetCode
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
                  props.action === "buy" ? "XLM" : assetCode
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
                  props.action === "buy" ? "XLM" : assetCode
                ].join(" ")}
                tolerance={0.02}
              />
            </MenuItem>
          </TextField>
          <ReadOnlyTextfield
            label="Amount to receive"
            style={{ flexGrow: 1, flexShrink: 0 }}
            value={`${formatBalance(String(estimatedCost), { minimumSignificants: 3 })} ${
              props.action === "buy" ? assetCode : "XLM"
            }`}
          />
          {/* TODO: "Large spread" alert */}
        </VerticalLayout>
        <VerticalLayout alignItems="stretch" justifyContent="stretch" grow={1} maxWidth="50%" shrink={1}>
          <Box
            alignItems="stretch"
            justifyContent="stretch"
            padding={16}
            style={{ background: grey["100"], marginTop: -60, marginLeft: 32 }}
          >
            <Typography gutterBottom variant="title">
              Trading assets
            </Typography>
            <Typography style={{ marginTop: 8 }} variant="body1">
              Convert your funds held in one asset to another by trading it on the Stellar Decentralized Exchange (DEX).
            </Typography>
            <Typography style={{ marginTop: 8 }} variant="body1">
              The trade will be made at the best price currently on offer and should happen immediately. High price
              volatility and low market volume can lead to short-term price changes, potentially causing your order to
              spend a prolonged time in the order book.
            </Typography>
            <Typography style={{ marginTop: 8 }} variant="body1">
              For this reason you can opt for a higher price limit, increasing your chance of an immediate conversion.
              The Stellar network will always try to buy at the lowest price within your limit first.
            </Typography>
          </Box>
        </VerticalLayout>
      </HorizontalLayout>
      <DialogActions amount={amount} disabled={amountString === ""} price={price} />
    </VerticalLayout>
  )
}

export default TradingTab
