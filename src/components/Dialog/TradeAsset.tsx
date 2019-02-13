import React from "react"
import { useState } from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Paper from "@material-ui/core/Paper"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import Typography from "@material-ui/core/Typography"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, useHorizon, useRouter, ObservedAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import { formatBalance } from "../Account/AccountBalances"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
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
  const horizon = useHorizon(props.account.testnet)
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy")

  const { asset, balance: tokenBalance } = findMatchingBalance(accountData.balances, props.assetCode)
  const xlmBalance = accountData.balances.find(balance => balance.asset_type === "native") || {
    asset_type: "native",
    balance: "0"
  }

  const handleTabsChange = (event: React.ChangeEvent<any>, value: "buy" | "sell") => setTradeAction(value)

  const createOfferCreationTransaction = (selling: Asset, buying: Asset, amount: number, price: number) => {
    const tx = createTransaction(
      [
        Operation.manageOffer({
          amount: amount.toFixed(7),
          buying,
          offerId: 0,
          price: price.toFixed(7),
          selling
        })
      ],
      {
        horizon,
        walletAccount: props.account
      }
    )
    return tx
  }

  const awaitThenSendTransaction = async (txPromise: Promise<Transaction>) => {
    try {
      props.sendTransaction(await txPromise)
    } catch (error) {
      trackError(error)
    }
  }

  const isDisabled = (amount: number, price: number) => {
    const balance =
      tradeAction === "buy"
        ? Number.parseFloat(xlmBalance.balance)
        : tokenBalance
          ? Number.parseFloat(tokenBalance.balance)
          : 0
    return [Number.isNaN(amount), Number.isNaN(price), amount <= 0, amount > balance, price <= 0].some(
      condition => condition === true
    )
  }

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
              DialogActions={({ amount, disabled, price }) => (
                <HorizontalLayout justifyContent="flex-end">
                  <DialogActionsBox>
                    {tradeAction === "buy" ? (
                      <ActionButton
                        disabled={disabled || isDisabled(amount, price)}
                        icon={<CallReceivedIcon />}
                        onClick={() =>
                          awaitThenSendTransaction(createOfferCreationTransaction(Asset.native(), asset, amount, price))
                        }
                        type="primary"
                      >
                        Create Buy Order
                      </ActionButton>
                    ) : (
                      <ActionButton
                        disabled={disabled || isDisabled(amount, price)}
                        icon={<CallMadeIcon />}
                        onClick={() =>
                          awaitThenSendTransaction(createOfferCreationTransaction(asset, Asset.native(), amount, price))
                        }
                        type="primary"
                      >
                        Create Sell Order
                      </ActionButton>
                    )}
                  </DialogActionsBox>
                </HorizontalLayout>
              )}
            />
          ) : null}
        </Paper>
      </VerticalLayout>
    </Dialog>
  )
}

function TradeAssetContainer(props: Pick<TradeAssetProps, "account" | "assetCode" | "open" | "onClose">) {
  const router = useRouter()
  const navigateToAssets = () => router.history.push(routes.manageAccountAssets(props.account.id))
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={navigateToAssets}>
      {txContext => <TradeAsset {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default TradeAssetContainer
