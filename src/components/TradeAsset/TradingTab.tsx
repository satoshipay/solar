import React from "react"
import { useState } from "react"
import { Asset } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import { useOrderbook } from "../../hooks"
import { brandColor } from "../../theme"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { VerticalMargin } from "../Layout/Spacing"
import { useTradingPair } from "./hooks"

const AssetCodeAdornment = (props: { children: string }) => (
  <InputAdornment disableTypography position="end" style={{ alignItems: "flex-start" }}>
    <Typography color="textPrimary" style={{ fontSize: "100%", lineHeight: "100%" }}>
      {props.children}
    </Typography>
  </InputAdornment>
)

export const ReadOnlyTextfield = (props: {
  label: TextFieldProps["label"]
  textAlign: React.CSSProperties["textAlign"]
  value: TextFieldProps["value"]
}) => (
  <TextField
    disabled
    inputProps={{
      style: {
        textAlign: props.textAlign
      }
    }}
    label={props.label}
    value={props.value}
    variant="outlined"
  />
)

interface TradingTabProps {
  action: "buy" | "sell"
  asset: Asset
  testnet: boolean
  tokenBalance: string
  xlmBalance: string
}

function TradingTab(props: TradingTabProps) {
  const assetCode = props.asset ? props.asset.code : ""

  const tradePair = useOrderbook(sellingAsset, buyingAsset, props.testnet)
  const [amountString, setAmountString] = useState("")
  const [priceString, setPriceString] = useState("")

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 1 : Number.parseFloat(amountString)
  const price = Number.parseFloat(priceString)

  const { estimatedCost, worstPriceOfBestMatches } = useTradingPair(tradePair, props.action, price, amount)

  return (
    <VerticalLayout padding="32px" alignItems="center">
      <HorizontalLayout justifyContent="space-evenly">
        <VerticalLayout alignItems="center" grow margin="0 0 24px">
          <TextField
            InputProps={{
              endAdornment: <AssetCodeAdornment>{assetCode}</AssetCodeAdornment>,
              style: {
                background: brandColor.main15,
                minWidth: "15em"
              }
            }}
            label={props.action === "buy" ? "Amount to Buy" : "Amount to Sell"}
            onChange={event => setAmountString(event.target.value)}
            value={amountString}
            variant="filled"
          />
          <VerticalMargin size={24} />
          <TextField
            InputProps={{
              endAdornment: <AssetCodeAdornment>XLM</AssetCodeAdornment>,
              style: {
                background: brandColor.main15,
                minWidth: "15em"
              }
            }}
            label={props.action === "buy" ? "Maximum Price to Pay" : "Minimum Price to Sell"}
            onChange={event => setPriceString(event.target.value)}
            value={priceString || worstPriceOfBestMatches || "0.00"}
            variant="filled"
          />
        </VerticalLayout>
        <VerticalLayout alignItems="center" grow margin="0 0 24px">
          <ReadOnlyTextfield
            label="Best Price for this Amount"
            textAlign="center"
            value={
              worstPriceOfBestMatches
                ? `${formatBalance(String(worstPriceOfBestMatches), { minimumSignificants: 3 })} XLM`
                : " "
            }
          />
          <VerticalMargin size={24} />
          <ReadOnlyTextfield
            label="Estimated Cost"
            textAlign="center"
            value={
              props.action === "buy"
                ? `${formatBalance(String(estimatedCost), { minimumSignificants: 3 })} XLM`
                : `${formatBalance(String(estimatedCost), { minimumSignificants: 3 })} ${props.asset.code}`
            }
          />
        </VerticalLayout>
      </HorizontalLayout>
      {/* TODO: "Large spread" alert */}
    </VerticalLayout>
  )
}

export default TradingTab
