import React from "react"
import { useState } from "react"
import { Asset } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import ArrowRightIcon from "@material-ui/icons/ArrowRightAlt"
import { useOrderbook } from "../../hooks"
import { invertOrderbookRecord } from "../../lib/orderbook"
import { brandColor } from "../../theme"
import { formatBalance } from "../Account/AccountBalances"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { useConversionOffers } from "./hooks"
import { HorizontalMargin } from "../Layout/Spacing"

const AssetCodeAdornment = (props: { children: string }) => (
  <InputAdornment disableTypography position="end" style={{ alignItems: "flex-start", pointerEvents: "none" }}>
    <Typography color="textPrimary" style={{ fontSize: "100%", lineHeight: "100%" }}>
      {props.children}
    </Typography>
  </InputAdornment>
)

export const PrimaryTextfield = (props: {
  adornment?: React.ReactNode
  label: TextFieldProps["label"]
  onChange: TextFieldProps["onChange"]
  style?: React.CSSProperties
  value: TextFieldProps["value"]
}) => (
  <TextField
    InputProps={{
      endAdornment: props.adornment,
      style: {
        background: brandColor.main15,
        minWidth: "15em"
      }
    }}
    label={props.label}
    onChange={props.onChange}
    style={props.style}
    value={props.value}
    variant="filled"
  />
)

export const ReadOnlyTextfield = (props: {
  label: TextFieldProps["label"]
  style?: React.CSSProperties
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
    style={props.style}
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

  const buyingTradePair = useOrderbook(Asset.native(), props.asset, props.testnet)
  const [amountString, setAmountString] = useState("")
  const [priceString, setPriceString] = useState("")

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 1 : Number.parseFloat(amountString)
  const price = Number.parseFloat(priceString)

  const { estimatedCost, worstPriceOfBestMatches } =
    props.action === "buy"
      ? useConversionOffers(buyingTradePair, amount, price)
      : useConversionOffers(invertOrderbookRecord(buyingTradePair), amount, price)

  const arrow = <ArrowRightIcon style={{ fontSize: 64 }} />
  const priceUnits = props.action === "buy" ? `${assetCode}s per XLM` : `XLMs per ${assetCode}`

  return (
    <VerticalLayout alignItems="stretch" padding="32px">
      <HorizontalLayout alignItems="center" justifyContent="space-evenly" margin="0 0 16px">
        <HorizontalMargin grow={1} shrink={1} size={16} />
        <PrimaryTextfield
          adornment={<AssetCodeAdornment>{props.action === "buy" ? "XLM" : assetCode}</AssetCodeAdornment>}
          label={"Amount to Convert"}
          onChange={event => setAmountString(event.target.value)}
          style={{ flexGrow: 1, width: 200 }}
          value={amountString}
        />
        <HorizontalMargin grow={1} shrink={1} size={16} />
        {arrow}
        <HorizontalMargin grow={1} shrink={1} size={16} />
        <ReadOnlyTextfield
          label="About to Receive"
          style={{ flexGrow: 1, width: 200 }}
          textAlign="center"
          value={`${formatBalance(String(estimatedCost), { minimumSignificants: 3 })} ${
            props.action === "buy" ? assetCode : "XLM"
          }`}
        />
        <HorizontalMargin grow={1} shrink={1} size={16} />
      </HorizontalLayout>
      <HorizontalLayout alignItems="center" justifyContent="space-evenly">
        <HorizontalMargin grow={1} shrink={1} size={16} />
        <PrimaryTextfield
          adornment={
            /* Just to keep the size in sync with the textfield above */
            <InputAdornment position="end" style={{ visibility: "hidden" }} />
          }
          label={`Price Limit (${priceUnits})`}
          onChange={event => setPriceString(event.target.value)}
          style={{ flexGrow: 1, width: 200 }}
          value={priceString || formatBalance(String(worstPriceOfBestMatches), { groupThousands: false }) || "0.00"}
        />
        <HorizontalMargin grow={1} shrink={1} size={16} />
        {/* Just to keep things aligned with the top row: */}
        <Box style={{ visibility: "hidden" }}>{arrow}</Box>
        <HorizontalMargin grow={1} shrink={1} size={16} />
        <ReadOnlyTextfield
          label="Best Price for this Amount"
          style={{ flexGrow: 1, width: 200 }}
          textAlign="center"
          value={
            worstPriceOfBestMatches
              ? `${formatBalance(String(worstPriceOfBestMatches), { minimumSignificants: 3 })} ${priceUnits}`
              : " "
          }
        />
        <HorizontalMargin grow={1} shrink={1} size={16} />
      </HorizontalLayout>
      {/* TODO: "Large spread" alert */}
    </VerticalLayout>
  )
}

export default TradingTab
