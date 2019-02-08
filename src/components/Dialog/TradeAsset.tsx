import React from "react"
import { useState } from "react"
import { Asset, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Paper from "@material-ui/core/Paper"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import Typography from "@material-ui/core/Typography"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import { Account } from "../../context/accounts"
import { useAccountData, ObservedAccountData } from "../../hooks"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin, VerticalMargin } from "../Layout/Spacing"
import TradingTab, { ReadOnlyTextfield } from "../TradeAsset/TradingTab"
import TransactionSender from "../TransactionSender"
import BackButton from "./BackButton"
import { ActionButton, DialogActionsBox } from "./Generic"

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
            <>
              <TradingTab
                action={tradeAction}
                asset={asset}
                testnet={props.account.testnet}
                tokenBalance={tokenBalance ? tokenBalance.balance : "0"}
                xlmBalance={xlmBalance.balance}
              />
              <VerticalMargin size={32} />
              <HorizontalLayout justifyContent="flex-end">
                <DialogActionsBox>
                  {/* TODO */}
                  {tradeAction === "buy" ? (
                    <ActionButton icon={<CallReceivedIcon />} onClick={() => undefined} type="primary">
                      Buy {asset.code}
                    </ActionButton>
                  ) : (
                    <ActionButton icon={<CallMadeIcon />} onClick={() => undefined} type="primary">
                      Sell {asset.code}
                    </ActionButton>
                  )}
                </DialogActionsBox>
              </HorizontalLayout>
            </>
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
