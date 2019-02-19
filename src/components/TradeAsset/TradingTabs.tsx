import React from "react"
import { useState } from "react"
import { Asset } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import MenuItem from "@material-ui/core/MenuItem"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import { useOrderbook } from "../../hooks"
import { calculateSpread } from "../../lib/orderbook"
import { formatBalance } from "../Account/AccountBalances"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { VerticalMargin } from "../Layout/Spacing"
import { warningColor } from "../../theme"
import Explanation from "./Explanation"
import { useConversionOffers } from "./hooks"

type ToleranceValue = 0 | 0.01 | 0.02

function isDisabled(amount: number, price: number, balance: number) {
  return [Number.isNaN(amount), Number.isNaN(price), amount <= 0, amount > balance, price <= 0].some(
    condition => condition === true
  )
}

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
  asset: Asset
  setTradeAction: (action: "buy" | "sell") => void
  tradeAction: "buy" | "sell"
  testnet: boolean
  tokenBalance: string
  xlmBalance: string
  DialogActions: React.ComponentType<{ amount: number; disabled?: boolean; price: number }>
}

function TradingTabs(props: TradingTabProps) {
  const DialogActions = props.DialogActions
  const assetCode = props.asset ? props.asset.code : ""
  const { setTradeAction, tradeAction } = props

  const handleTabsChange = (event: React.ChangeEvent<any>, value: "buy" | "sell") => setTradeAction(value)

  const tradePair = useOrderbook(props.asset, Asset.native(), props.testnet)

  const [amountString, setAmountString] = useState("")
  const [tolerance, setTolerance] = useState<ToleranceValue>(0)

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 0 : Number.parseFloat(amountString)
  const balance = tradeAction === "buy" ? Number.parseFloat(props.xlmBalance) : Number.parseFloat(props.tokenBalance)

  const { estimatedCost, worstPriceOfBestMatches } = useConversionOffers(
    tradeAction === "buy" ? tradePair.asks : tradePair.bids,
    amount || 0.01
  )

  const price = worstPriceOfBestMatches || 0
  const { relativeSpread } = calculateSpread(tradePair.asks, tradePair.bids)

  return (
    <VerticalLayout>
      <HorizontalLayout shrink={0} wrap="wrap">
        <VerticalLayout alignItems="stretch" basis="50%" grow={1} shrink={1}>
          <Tabs indicatorColor="primary" onChange={handleTabsChange} textColor="primary" value={tradeAction}>
            <Tab label="Buy" value="buy" />
            <Tab label="Sell" value="sell" />
          </Tabs>
          <VerticalMargin size={24} />
          <TextField
            InputProps={{
              endAdornment: <AssetCodeAdornment>{tradeAction === "buy" ? "XLM" : assetCode}</AssetCodeAdornment>,
              style: {
                minWidth: "15em"
              }
            }}
            autoFocus
            label="Amount to convert"
            placeholder={`Max. ${formatBalance(tradeAction === "buy" ? props.xlmBalance : props.tokenBalance)}`}
            onChange={event => setAmountString(event.target.value)}
            style={{ marginBottom: 24 }}
            value={amountString}
          />
          <TextField
            label={`Price per ${tradeAction === "buy" ? assetCode : "XLM"}`}
            onChange={event => setTolerance((event.target.value as any) as ToleranceValue)}
            select
            style={{ marginBottom: 24 }}
            value={tolerance}
          >
            <MenuItem value={0}>
              <PriceTolerance
                label="Regular"
                price={[
                  worstPriceOfBestMatches
                    ? formatBalance(
                        String(tradeAction === "buy" ? worstPriceOfBestMatches : 1 / worstPriceOfBestMatches),
                        { groupThousands: false }
                      )
                    : "0.00",
                  tradeAction === "buy" ? "XLM" : assetCode
                ].join(" ")}
                tolerance={0}
              />
            </MenuItem>
            <MenuItem value={0.01}>
              <PriceTolerance
                label="Fast"
                price={[
                  worstPriceOfBestMatches
                    ? formatBalance(String(worstPriceOfBestMatches * 1.01), { groupThousands: false })
                    : "0.00",
                  tradeAction === "buy" ? "XLM" : assetCode
                ].join(" ")}
                tolerance={0.01}
              />
            </MenuItem>
            <MenuItem value={0.02}>
              <PriceTolerance
                label="Super fast"
                price={[
                  worstPriceOfBestMatches
                    ? formatBalance(String(worstPriceOfBestMatches * 1.02), { groupThousands: false })
                    : "0.00",
                  tradeAction === "buy" ? "XLM" : assetCode
                ].join(" ")}
                tolerance={0.02}
              />
            </MenuItem>
          </TextField>
          <ReadOnlyTextfield
            label="Amount to receive"
            style={{ marginBottom: 24 }}
            value={
              amount
                ? [
                    formatBalance(String(estimatedCost), { minimumSignificants: 3 }),
                    tradeAction === "buy" ? assetCode : "XLM"
                  ].join(" ")
                : "-"
            }
          />
          {relativeSpread > 0.01 ? (
            <Box padding="8px 12px" style={{ background: warningColor }}>
              <b>Warning</b>
              <br />
              Large spread ({(relativeSpread * 100).toFixed(1)}
              %) between buying and selling price. Converting the funds back could be expensive.
            </Box>
          ) : null}
        </VerticalLayout>
        <VerticalLayout
          alignItems="stretch"
          basis="50%"
          grow={1}
          shrink={1}
          minWidth={350}
          style={{ marginTop: 8, paddingLeft: 48 }}
        >
          <Explanation />
        </VerticalLayout>
      </HorizontalLayout>
      <DialogActions
        amount={amount}
        disabled={amountString === "" || isDisabled(amount, price, balance)}
        price={price}
      />
    </VerticalLayout>
  )
}

export default TradingTabs
