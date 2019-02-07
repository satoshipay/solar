import React from "react"
import { useMemo, useState } from "react"
import { Asset, OrderbookRecord, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import InputAdornment from "@material-ui/core/InputAdornment"
import Paper from "@material-ui/core/Paper"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import { Account } from "../../context/accounts"
import { FixedOrderbookOffer } from "../../lib/orderbook"
import { useAccountData, useOrderbook, ObservedAccountData, ObservedTradingPair } from "../../hooks"
import { brandColor } from "../../theme"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalLayout, VerticalLayout, Box } from "../Layout/Box"
import { HorizontalMargin, VerticalMargin } from "../Layout/Spacing"
import TransactionSender from "../TransactionSender"
import BackButton from "./BackButton"
import { ActionButton, DialogActionsBox } from "./Generic"

const sum = (numbers: number[]) => numbers.reduce((total, no) => total + no, 0)

function findMatchingBalance(balances: ObservedAccountData["balances"], assetCode: string) {
  const matchingBalance = balances.find(balance => balance.asset_type !== "native" && balance.asset_code === assetCode)

  if (matchingBalance && matchingBalance.asset_type !== "native") {
    return {
      asset: new Asset(matchingBalance.asset_code, matchingBalance.asset_issuer),
      balance: matchingBalance
    }
  } else {
    return {
      asset: null,
      balance: null
    }
  }
}

const AssetCodeAdornment = (props: { children: string }) => (
  <InputAdornment disableTypography position="end" style={{ alignItems: "flex-start" }}>
    <Typography color="textPrimary" style={{ fontSize: "100%", lineHeight: "100%" }}>
      {props.children}
    </Typography>
  </InputAdornment>
)

const ReadOnlyTextfield = (props: {
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
  const [sellingAsset, buyingAsset] =
    props.action === "buy" ? [Asset.native(), props.asset] : [props.asset, Asset.native()]

  const tradePair = useOrderbook(sellingAsset, buyingAsset, props.testnet)
  const [amountString, setAmountString] = useState("")
  const [priceString, setPriceString] = useState("")

  const amount = Number.isNaN(Number.parseFloat(amountString)) ? 1 : Number.parseFloat(amountString)
  const price = Number.parseFloat(priceString)

  // Best offers first
  const bestOffers = useMemo(
    () =>
      props.action === "buy"
        ? [...tradePair.asks].sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price))
        : [...tradePair.bids].sort((a, b) => Number.parseFloat(b.price) - Number.parseFloat(a.price)),
    [props.action, props.action === "buy" ? tradePair.asks : tradePair.bids]
  )

  const bestMatches = useMemo(
    () =>
      bestOffers
        .filter(
          offer =>
            Number.isNaN(price) ||
            (props.action === "buy" ? parseFloat(offer.price) < price : parseFloat(offer.price) > price)
        )
        .reduce<{ offers: FixedOrderbookOffer[]; volume: number }>(
          (aggregate, matchingOffer) =>
            aggregate.volume >= amount
              ? aggregate
              : {
                  offers: [...aggregate.offers, matchingOffer],
                  volume: aggregate.volume + Number.parseFloat(matchingOffer.amount)
                },
          { offers: [], volume: 0 }
        ),
    [props.action, bestOffers, amountString, priceString]
  )

  const bestPrices = bestMatches.offers.map(offer => Number.parseFloat(offer.price))
  const worstPriceOfBestMatches =
    bestPrices.length > 0 ? (props.action === "buy" ? Math.max(...bestPrices) : Math.min(...bestPrices)) : undefined

  const firstBestOffers = bestMatches.offers.slice(0, -1)
  const lastBestOffer = bestMatches.offers[bestMatches.offers.length - 1]

  const estimatedCost = sum([
    ...firstBestOffers.slice(0, -1).map(offer => Number.parseFloat(offer.amount) * Number.parseFloat(offer.price)),
    Number.parseFloat(lastBestOffer.price) * (Number.parseFloat(lastBestOffer.amount) - (bestMatches.volume - amount))
  ])

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
      <VerticalMargin size={32} />
      <HorizontalLayout justifyContent="flex-end">
        <DialogActionsBox>
          {/* TODO */}
          {props.action === "buy" ? (
            <ActionButton icon={<CallReceivedIcon />} onClick={() => undefined} type="primary">
              Buy {assetCode}
            </ActionButton>
          ) : (
            <ActionButton icon={<CallMadeIcon />} onClick={() => undefined} type="primary">
              Sell {assetCode}
            </ActionButton>
          )}
        </DialogActionsBox>
      </HorizontalLayout>
    </VerticalLayout>
  )
}

interface TradeAssetProps {
  account: Account
  assetCode: string
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

const Transition = (props: SlideProps) => <Slide {...props} direction="left" />

function TradeAsset(props: TradeAssetProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy")

  const { asset, balance: tokenBalance } = findMatchingBalance(accountData.balances, props.assetCode)
  const xlmBalance = accountData.balances.find(balance => balance.asset_type === "native") || {
    asset_type: "native",
    balance: "0"
  }

  const handleTabsChange = (event: React.ChangeEvent<any>, value: "buy" | "sell") => setTradeAction(value)

  return (
    <Dialog open={props.open} fullScreen onClose={props.onClose} TransitionComponent={Transition}>
      <VerticalLayout width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <HorizontalLayout justifyContent="space-between" margin="0 0 24px" shrink={0}>
          <HorizontalLayout alignItems="center" margin="0 0 24px">
            <BackButton onClick={props.onClose} />
            <Typography variant="headline" style={{ flexGrow: 1 }}>
              Trade {props.assetCode}
            </Typography>
          </HorizontalLayout>
          <HorizontalLayout justifyContent="flex-end">
            <ReadOnlyTextfield
              label={`${props.assetCode} Balance`}
              textAlign="right"
              value={tokenBalance ? formatBalance(tokenBalance.balance, { minimumSignificants: 3 }) : "0.00"}
            />
            <HorizontalMargin size={16} />
            <ReadOnlyTextfield
              label="XLM Balance"
              textAlign="right"
              value={formatBalance(xlmBalance.balance, { minimumSignificants: 3 })}
            />
          </HorizontalLayout>
        </HorizontalLayout>
        <Paper elevation={1} square>
          <Tabs fullWidth indicatorColor="primary" onChange={handleTabsChange} textColor="primary" value={tradeAction}>
            <Tab label={`Buy ${props.assetCode}`} value="buy" />
            <Tab label={`Sell ${props.assetCode}`} value="sell" />
          </Tabs>
          {asset ? (
            <TradingTab
              action={tradeAction}
              asset={asset}
              testnet={props.account.testnet}
              tokenBalance={tokenBalance ? tokenBalance.balance : "0"}
              xlmBalance={xlmBalance.balance}
            />
          ) : null}
        </Paper>
      </VerticalLayout>
    </Dialog>
  )
}

function TradeAssetContainer(props: Pick<TradeAssetProps, "account" | "assetCode" | "open" | "onClose">) {
  return (
    <TransactionSender account={props.account}>
      {txContext => <TradeAsset {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default TradeAssetContainer
