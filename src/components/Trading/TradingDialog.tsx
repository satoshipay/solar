import React from "react"
import { Asset, Horizon, Server, Transaction } from "stellar-sdk"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useDialogActions, useRouter } from "../../hooks/userinterface"
import { getLastArgumentFromURL } from "../../lib/url"
import { matchesRoute } from "../../lib/routes"
import { parseAssetID, stringifyAsset } from "../../lib/stellar"
import * as routes from "../../routes"
import DialogBody from "../Dialog/DialogBody"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { HorizontalLayout } from "../Layout/Box"
import ScrollableBalances from "../Lazy/ScrollableBalances"
import MainTitle from "../MainTitle"
import Portal from "../Portal"
import TransactionSender from "../TransactionSender"
import ViewLoading from "../ViewLoading"
import MainActionSelection from "./MainActionSelection"
import TradingForm from "./TradingForm"

interface TradingDialogProps {
  account: Account
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function getAssetFromPath(pathname: string) {
  if (matchesRoute(pathname, routes.tradeAsset("*", undefined, "*"))) {
    const lastArgument = getLastArgumentFromURL(pathname)
    if (lastArgument !== "buy" && lastArgument !== "sell") {
      return parseAssetID(lastArgument)
    }
  }
  return undefined
}

function TradingDialog(props: TradingDialogProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const dialogActionsRef = useDialogActions()
  const router = useRouter()
  const [preselectedAsset, setPreselectedAsset] = React.useState<Asset | undefined>()

  React.useEffect(() => {
    const asset = getAssetFromPath(router.location.pathname)
    setPreselectedAsset(asset)
  }, [router.location.pathname])

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
    router.history.push(
      routes.tradeAsset(props.account.id, undefined, preselectedAsset ? stringifyAsset(preselectedAsset) : undefined)
    )
  }, [preselectedAsset, props.account, router.history])

  const selectPrimaryAction = React.useCallback(
    (mainAction: "buy" | "sell") => {
      router.history.push(
        routes.tradeAsset(props.account.id, mainAction, preselectedAsset ? stringifyAsset(preselectedAsset) : undefined)
      )
    },
    [preselectedAsset, props.account, router.history]
  )

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
          <React.Suspense fallback={<ViewLoading />}>
            <TradingForm
              account={props.account}
              accountData={accountData}
              dialogActionsRef={dialogActionsRef}
              initialPrimaryAsset={preselectedAsset}
              onBack={clearPrimaryAction}
              primaryAction={primaryAction}
              sendTransaction={props.sendTransaction}
              style={mainContentStageStyle}
              trustlines={trustlines}
            />
          </React.Suspense>
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
        <Portal target={dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton
              autoFocus
              onClick={() => router.history.push(routes.manageAccountAssets(props.account.id))}
              type="primary"
            >
              Add asset
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </Box>
    ),
    [dialogActionsRef, props.account, router]
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
