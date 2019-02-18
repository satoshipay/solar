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
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { VerticalMargin } from "../Layout/Spacing"
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
  testnet: boolean
  tokenBalance: string
  xlmBalance: string
  DialogActions: React.ComponentType<{ amount: number; disabled?: boolean; price: number; tradeAction: "buy" | "sell" }>
}

function TradingTab(props: TradingTabProps) {
  const DialogActions = props.DialogActions
  const assetCode = props.asset ? props.asset.code : ""

  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy")
  const handleTabsChange = (event: React.ChangeEvent<any>, value: "buy" | "sell") => setTradeAction(value)

  const tradePair =
    tradeAction === "buy"
      ? useOrderbook(Asset.native(), props.asset, props.testnet)
      : useOrderbook(props.asset, Asset.native(), props.testnet)
  const [amountString, setAmountString] = useState("")
  const [tolerance, setTolerance] = useState<ToleranceValue>(0)

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 0 : Number.parseFloat(amountString)
  const balance = tradeAction === "buy" ? Number.parseFloat(props.xlmBalance) : Number.parseFloat(props.tokenBalance)

  const { estimatedCost, worstPriceOfBestMatches } = useConversionOffers(tradePair, amount, Number.NaN)
  const price = worstPriceOfBestMatches || 0

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
                    ? formatBalance(String(1 / worstPriceOfBestMatches), { groupThousands: false })
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
                    ? formatBalance(String((1 / worstPriceOfBestMatches) * 1.01), { groupThousands: false })
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
                    ? formatBalance(String((1 / worstPriceOfBestMatches) * 1.02), { groupThousands: false })
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
            value={[
              formatBalance(String(estimatedCost), { minimumSignificants: 3 }),
              tradeAction === "buy" ? assetCode : "XLM"
            ].join(" ")}
          />
          {/* TODO: "Large spread" alert */}
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
        tradeAction={tradeAction}
      />
    </VerticalLayout>
  )
}

export default TradingTab
