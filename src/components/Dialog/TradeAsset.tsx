import React from "react"
import { useState } from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Tab from "@material-ui/core/Tab"
import Tabs from "@material-ui/core/Tabs"
import Typography from "@material-ui/core/Typography"
import GavelIcon from "@material-ui/icons/Gavel"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, useHorizon, useRouter, ObservedAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import AccountBalances from "../Account/AccountBalances"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import TradingTab from "../TradeAsset/TradingTab"
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

function Title(props: { assetCode: string; onClose: () => void }) {
  return (
    <HorizontalLayout justifyContent="space-between" margin="0" shrink={0}>
      <HorizontalLayout alignItems="center" margin="0">
        <BackButton onClick={props.onClose} style={{ marginLeft: -10, marginRight: 10 }} />
        <Typography variant="headline" style={{ flexGrow: 1 }}>
          Trade {props.assetCode}
        </Typography>
      </HorizontalLayout>
    </HorizontalLayout>
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
        <Title assetCode={props.assetCode} onClose={props.onClose} />
        <Typography
          color="inherit"
          component="div"
          variant="body1"
          style={{ marginLeft: 48, marginBottom: 16, fontSize: "1.2rem" }}
        >
          <AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />
        </Typography>
        <Tabs indicatorColor="primary" onChange={handleTabsChange} textColor="primary" value={tradeAction}>
          <Tab label="Buy" value="buy" />
          <Tab label="Sell" value="sell" />
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
                  <ActionButton
                    disabled={disabled || isDisabled(amount, price)}
                    icon={<GavelIcon />}
                    onClick={() =>
                      tradeAction === "buy"
                        ? awaitThenSendTransaction(createOfferCreationTransaction(Asset.native(), asset, amount, price))
                        : awaitThenSendTransaction(createOfferCreationTransaction(asset, Asset.native(), amount, price))
                    }
                    type="primary"
                  >
                    Place order
                  </ActionButton>
                </DialogActionsBox>
              </HorizontalLayout>
            )}
          />
        ) : null}
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
