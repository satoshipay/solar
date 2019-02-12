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
import { HorizontalMargin, VerticalMargin } from "../Layout/Spacing"

const mockedTradePair: ReturnType<typeof useOrderbook> = {
  asks: [
    {
      price_r: {
        n: 1,
        d: 12
      },
      price: "0.0833333",
      amount: "600.0000072"
    },
    {
      price_r: {
        n: 25,
        d: 279
      },
      price: "0.0896057",
      amount: "1116.0000000"
    },
    {
      price_r: {
        n: 100,
        d: 1111
      },
      price: "0.0900090",
      amount: "2573.8935416"
    },
    {
      price_r: {
        n: 1,
        d: 11
      },
      price: "0.0909091",
      amount: "804.7811574"
    },
    {
      price_r: {
        n: 5000000,
        d: 37600283
      },
      price: "0.1329777",
      amount: "30.6461506"
    }
  ],
  base: Asset.native(),
  bids: [
    {
      price_r: {
        n: 2,
        d: 29
      },
      price: "0.0689655",
      amount: "99.9999994"
    },
    {
      price_r: {
        n: 7828,
        d: 114450
      },
      price: "0.0683967",
      amount: "0.7081478"
    },
    {
      price_r: {
        n: 1000000,
        d: 14684593
      },
      price: "0.0680986",
      amount: "27.6169287"
    },
    {
      price_r: {
        n: 1,
        d: 1000000
      },
      price: "0.0000010",
      amount: "1.9031258"
    },
    {
      price_r: {
        n: 1,
        d: 10000000
      },
      price: "0.0000001",
      amount: "1.2000000"
    }
  ],
  counter: new Asset("EURT", "GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S"),
  loading: false
}

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
  DialogActions: React.ComponentType<{ amount: number; disabled?: boolean; price: number }>
}

function TradingTab(props: TradingTabProps) {
  const DialogActions = props.DialogActions
  const assetCode = props.asset ? props.asset.code : ""

  const buyingTradePair = mockedTradePair // useOrderbook(Asset.native(), props.asset, props.testnet)
  const [amountString, setAmountString] = useState("")
  const [priceString, setPriceString] = useState("")

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 1 : Number.parseFloat(amountString)
  const priceRaw = Number.parseFloat(priceString)

  const { estimatedCost, worstPriceOfBestMatches } =
    props.action === "buy"
      ? useConversionOffers(buyingTradePair, amount, priceRaw)
      : useConversionOffers(invertOrderbookRecord(buyingTradePair), amount, priceRaw)

  const arrow = <ArrowRightIcon style={{ fontSize: 64 }} />
  const price = Number.isNaN(priceRaw) ? worstPriceOfBestMatches || 0 : priceRaw
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
            <InputAdornment position="end" style={{ visibility: "hidden" }}>
              <></>
            </InputAdornment>
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
      <VerticalMargin size={32} />
      <DialogActions amount={amount} disabled={amountString === ""} price={price} />
    </VerticalLayout>
  )
}

export default TradingTab
