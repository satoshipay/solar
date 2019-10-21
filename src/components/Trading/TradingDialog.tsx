import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon, Operation, Server, Transaction } from "stellar-sdk"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useHorizon } from "../../hooks/stellar"
import { useLiveAccountData, ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useDialogActions, useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import { balancelineToAsset } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import * as routes from "../../routes"
import ScrollableBalances from "../AccountAssets/ScrollableBalances"
import MainTitle from "../MainTitle"
import TradingForm from "./TradingForm"
import TransactionSender from "../TransactionSender"
import DialogBody from "../Dialog/DialogBody"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { HorizontalLayout } from "../Layout/Box"
import MainActionSelection from "./MainActionSelection"

interface TradingDialogProps {
  account: Account
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function TradingDialog(props: TradingDialogProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const dialogActionsRef = useDialogActions()
  const horizon = useHorizon(props.account.testnet)
  const router = useRouter()

  const trustlines = React.useMemo(
    () =>
      accountData.balances.filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native"),
    [accountData.balances]
  )

  const primaryAction: "buy" | "sell" | undefined = matchesRoute(
    router.location.pathname,
    routes.tradeAsset("*", "buy")
  )
    ? "buy"
    : matchesRoute(router.location.pathname, routes.tradeAsset("*", "sell"))
    ? "sell"
    : undefined

  const clearPrimaryAction = React.useCallback(() => {
    router.history.push(routes.tradeAsset(props.account.id))
  }, [props.account, router.history])

  const selectPrimaryAction = React.useCallback(
    (mainAction: "buy" | "sell") => {
      router.history.push(routes.tradeAsset(props.account.id, mainAction))
    },
    [props.account, router.history]
  )

  const createOfferCreationTransaction = (selling: Asset, buying: Asset, amount: BigNumber, price: BigNumber) => {
    const tx = createTransaction(
      [
        Operation.manageSellOffer({
          amount: amount.toFixed(7),
          buying,
          offerId: 0,
          price: price.toFixed(7),
          selling
        })
      ],
      {
        accountData,
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

  const mainContentStageStyle: React.CSSProperties = {
    flexBasis: "100%",
    minWidth: "100%",
    width: "100%"
  }

  const MainContent = React.useMemo(
    () => (
      <HorizontalLayout overflowX="hidden" width="100%">
        <div
          style={{
            flexBasis: "0",
            flexGrow: 0,
            marginLeft: primaryAction ? "-100%" : "0",
            transition: "margin-left .3s"
          }}
        />
        <MainActionSelection
          onSelectBuy={() => selectPrimaryAction("buy")}
          onSelectSell={() => selectPrimaryAction("sell")}
          style={{
            ...mainContentStageStyle,
            alignItems: "flex-start",
            margin: "48px 0 24px"
          }}
        />
        {primaryAction ? (
          <TradingForm
            account={props.account}
            accountData={accountData}
            dialogActionsRef={dialogActionsRef}
            onBack={clearPrimaryAction}
            primaryAction={primaryAction}
            sendTransaction={props.sendTransaction}
            style={mainContentStageStyle}
            trustlines={trustlines}
          />
        ) : (
          <div style={mainContentStageStyle} />
        )}
      </HorizontalLayout>
    ),
    [dialogActionsRef, primaryAction, selectPrimaryAction, trustlines]
  )

  const LinkToManageAssets = React.useMemo(
    () => (
      <Box margin="32px 0 0" textAlign="center">
        <Typography>This account doesn't use any assets other than Stellar Lumens yet.</Typography>
        <ActionsContainer>
          <DialogActionsBox>
            <ActionButton
              autoFocus
              onClick={() => router.history.push(routes.manageAccountAssets(props.account.id))}
              type="primary"
            >
              Add asset
            </ActionButton>
          </DialogActionsBox>
        </ActionsContainer>
      </Box>
    ),
    [props.account, router, ActionsContainer]
  )

  return (
    <DialogBody
      top={
        <>
          <MainTitle title="Trade" onBack={props.onClose} />
          <ScrollableBalances account={props.account} compact />
        </>
      }
      actions={dialogActionsRef}
    >
      {trustlines.length > 0 ? MainContent : LinkToManageAssets}
    </DialogBody>
  )
}

function TradingDialogContainer(props: Pick<TradingDialogProps, "account" | "onClose">) {
  const router = useRouter()
  const navigateToAssets = () => router.history.push(routes.account(props.account.id))

  return (
    <TransactionSender account={props.account} onSubmissionCompleted={navigateToAssets}>
      {txContext => <TradingDialog {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default TradingDialogContainer
