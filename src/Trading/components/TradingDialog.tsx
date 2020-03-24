import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Horizon, Server, Transaction } from "stellar-sdk"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import { Account } from "~App/contexts/accounts"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useDialogActions, useRouter } from "~Generic/hooks/userinterface"
import { getLastArgumentFromURL } from "~Generic/lib/url"
import { matchesRoute } from "~Generic/lib/routes"
import { parseAssetID, stringifyAsset } from "~Generic/lib/stellar"
import * as routes from "../../routes"
import DialogBody from "~Layout/components/DialogBody"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import Carousel from "~Layout/components/Carousel"
import ScrollableBalances from "~Generic/components/ScrollableBalances"
import MainTitle from "~Generic/components/MainTitle"
import Portal from "~Generic/components/Portal"
import TransactionSender from "~Transaction/components/TransactionSender"
import ViewLoading from "~Generic/components/ViewLoading"
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
  const { t } = useTranslation()

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

  const MainContent = React.useMemo(
    () => (
      <Carousel current={primaryAction ? 1 : 0}>
        <MainActionSelection
          onSelectBuy={() => selectPrimaryAction("buy")}
          onSelectSell={() => selectPrimaryAction("sell")}
        />
        <React.Suspense fallback={<ViewLoading />}>
          <TradingForm
            account={props.account}
            accountData={accountData}
            dialogActionsRef={dialogActionsRef}
            initialPrimaryAsset={preselectedAsset}
            primaryAction={primaryAction || "buy"}
            sendTransaction={props.sendTransaction}
            trustlines={trustlines}
          />
        </React.Suspense>
      </Carousel>
    ),
    [
      accountData,
      dialogActionsRef,
      preselectedAsset,
      primaryAction,
      props.account,
      props.sendTransaction,
      selectPrimaryAction,
      trustlines
    ]
  )

  const LinkToManageAssets = React.useMemo(
    () => (
      <Box margin="32px 0 0" textAlign="center">
        <Typography>{t("trading.no-assets-info")}</Typography>
        <Portal target={dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton
              autoFocus
              onClick={() => router.history.push(routes.manageAccountAssets(props.account.id))}
              type="primary"
            >
              {t("trading.actions.add-asset")}
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </Box>
    ),
    [dialogActionsRef, props.account, router, t]
  )

  return (
    <DialogBody
      top={
        <>
          <MainTitle title={t("trading.title")} onBack={primaryAction ? clearPrimaryAction : props.onClose} />
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
