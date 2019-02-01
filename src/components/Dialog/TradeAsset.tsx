import React from "react"
import { useState } from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import InputAdornment from "@material-ui/core/InputAdornment"
import Paper from "@material-ui/core/Paper"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import { Account } from "../../context/accounts"
import { useAccountData, ObservedAccountData } from "../../hooks"
import { brandColor } from "../../theme"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin, VerticalMargin } from "../Layout/Spacing"
import TransactionSender from "../TransactionSender"
import BackButton from "./BackButton"
import { ActionButton, DialogActionsBox } from "./Generic"

const Transition = (props: SlideProps) => <Slide {...props} direction="left" />

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

interface TradingTabProps {
  action: "buy" | "sell"
  asset: Asset | null
  tokenBalance: string
  xlmBalance: string
}

function TradingTab(props: TradingTabProps) {
  const assetCode = props.asset ? props.asset.code : ""
  const [amountString, setAmountString] = useState("0.00")
  return (
    <VerticalLayout padding="32px" alignItems="center">
      <VerticalLayout alignItems="stretch">
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
          disabled
          inputProps={{
            style: {
              textAlign: "center"
            }
          }}
          label="Current Rate"
          value={" " /* TODO */}
          variant="outlined"
        />
        <VerticalMargin size={24} />
        <TextField disabled label="Estimated Cost" value={" " /* TODO */} variant="outlined" />
      </VerticalLayout>
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
            <TextField
              disabled
              inputProps={{
                style: {
                  textAlign: "right"
                }
              }}
              label={`${props.assetCode} Balance`}
              value={tokenBalance ? formatBalance(tokenBalance.balance, { minimumSignificants: 3 }) : "0.00"}
              variant="outlined"
            />
            <HorizontalMargin size={16} />
            <TextField
              disabled
              inputProps={{
                style: {
                  textAlign: "right"
                }
              }}
              label="XLM Balance"
              value={formatBalance(xlmBalance.balance, { minimumSignificants: 3 })}
              variant="outlined"
            />
          </HorizontalLayout>
        </HorizontalLayout>
        <Paper elevation={1} square>
          <Tabs fullWidth indicatorColor="primary" onChange={handleTabsChange} textColor="primary" value={tradeAction}>
            <Tab label={`Buy ${props.assetCode}`} value="buy" />
            <Tab label={`Sell ${props.assetCode}`} value="sell" />
          </Tabs>
          <TradingTab
            action={tradeAction}
            asset={asset}
            tokenBalance={tokenBalance ? tokenBalance.balance : "0"}
            xlmBalance={xlmBalance.balance}
          />
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
