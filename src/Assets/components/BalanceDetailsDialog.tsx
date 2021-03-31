import BigNumber from "big.js"
import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Horizon, ServerApi } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import AddIcon from "@material-ui/icons/Add"
import { Account } from "~App/contexts/accounts"
import * as routes from "~App/routes"
import { FullscreenDialogTransition } from "~App/theme"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import { useLiveAccountData, useLiveAccountOffers } from "~Generic/hooks/stellar-subscriptions"
import { AccountData } from "~Generic/lib/account"
import { matchesRoute } from "~Generic/lib/routes"
import { stringifyAsset, getAccountMinimumBalance, getSpendableBalance } from "~Generic/lib/stellar"
import { sortBalances } from "~Generic/lib/balances"
import MainTitle from "~Generic/components/MainTitle"
import ViewLoading from "~Generic/components/ViewLoading"
import DialogBody from "~Layout/components/DialogBody"
import AddAssetDialog from "./AddAssetDialog"
import BalanceDetailsListItem from "./BalanceDetailsListItem"
import ButtonListItem from "./ButtonListItem"

function isAssetMatchingBalance(asset: Asset, balance: Horizon.BalanceLine): boolean {
  if (balance.asset_type === "native") {
    return asset.isNative()
  } else {
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer()
  }
}

interface TrustedAssetsProps {
  account: Account
  accountData: AccountData
  assets: Asset[]
  hmargin: string | number
  hpadding: string | number
  onOpenAssetDetails: (asset: Asset) => void
  openOffers: ServerApi.OfferRecord[]
  olderOffersAvailable?: boolean
}

const TrustedAssets = React.memo(function TrustedAssets(props: TrustedAssetsProps) {
  return (
    <>
      {props.assets.map(asset => {
        const balance = props.accountData.balances.find(bal => isAssetMatchingBalance(asset, bal))
        const openOffers = props.openOffers.filter(
          offer =>
            (offer.buying.asset_code === asset.code && offer.buying.asset_issuer === asset.issuer) ||
            (offer.selling.asset_code === asset.code && offer.selling.asset_issuer === asset.issuer)
        )
        const badgeCount = props.olderOffersAvailable && openOffers.length >= 10 ? "10+" : openOffers.length
        return (
          <BalanceDetailsListItem
            key={stringifyAsset(asset)}
            badgeCount={badgeCount}
            balance={balance!}
            onClick={() => props.onOpenAssetDetails(asset)}
            style={{
              paddingLeft: props.hpadding,
              paddingRight: props.hpadding,
              marginLeft: props.hmargin,
              marginRight: props.hmargin
            }}
            testnet={props.account.testnet}
          />
        )
      })}
    </>
  )
})

interface NativeBalanceItemsProps {
  account: Account
  accountData: AccountData
  balance: Horizon.BalanceLineNative
  hmargin: string | number
  hpadding: string | number
  onOpenAssetDetails: (asset: Asset) => void
}

const NativeBalanceItems = React.memo(function NativeBalanceItems(props: NativeBalanceItemsProps) {
  return (
    <>
      <BalanceDetailsListItem
        key="XLM"
        balance={props.balance}
        onClick={() => props.onOpenAssetDetails(Asset.native())}
        style={{
          paddingLeft: props.hpadding,
          paddingRight: props.hpadding,
          marginLeft: props.hmargin,
          marginRight: props.hmargin
        }}
        testnet={props.account.testnet}
      />
      <BalanceDetailsListItem
        key="XLM:spendable"
        balance={{
          ...props.balance,
          balance: BigNumber(props.balance.balance).eq(0)
            ? "0"
            : getSpendableBalance(getAccountMinimumBalance(props.accountData), props.balance).toString()
        }}
        hideLogo
        onClick={() => props.onOpenAssetDetails(Asset.native())}
        spendableBalance
        style={{
          marginTop: -8,
          paddingLeft: props.hpadding,
          paddingRight: props.hpadding,
          marginLeft: props.hmargin,
          marginRight: props.hmargin
        }}
        testnet={props.account.testnet}
      />
    </>
  )
})

interface BalanceDetailsProps {
  account: Account
  onClose: () => void
}

function BalanceDetailsDialog(props: BalanceDetailsProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const { offers: openOrders, olderOffersAvailable } = useLiveAccountOffers(
    props.account.publicKey,
    props.account.testnet
  )
  const isSmallScreen = useIsMobile()
  const router = useRouter()
  const { t } = useTranslation()

  const openAddAssetDialog = React.useCallback(
    () => router.history.push(routes.manageAccountAssets(props.account.id)),
    [props.account.id, router.history]
  )
  const closeAddAssetDialog = React.useCallback(() => router.history.push(routes.balanceDetails(props.account.id)), [
    props.account.id,
    router.history
  ])

  const addAssetDialogOpen = matchesRoute(router.location.pathname, routes.manageAccountAssets(props.account.id))
  const assetDetailsDialogOpen =
    matchesRoute(router.location.pathname, routes.assetDetails("*", "*")) &&
    !matchesRoute(router.location.pathname, routes.assetDetails("*", "manage"))

  const openAssetDetails = (asset: Asset) =>
    router.history.push(routes.assetDetails(props.account.id, stringifyAsset(asset)))

  const trustedAssets = sortBalances(accountData.balances)
    .filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native")
    .map(balance => new Asset(balance.asset_code, balance.asset_issuer))

  const nativeBalance = accountData.balances.find(
    (balance): balance is Horizon.BalanceLineNative => balance.asset_type === "native"
  )

  const hpadding = isSmallScreen ? 0 : 8
  const itemHPadding = 16
  const itemHMargin = 0

  return (
    <DialogBody excessWidth={12} top={<MainTitle onBack={props.onClose} title={props.account.name} />}>
      <List style={{ paddingLeft: hpadding, paddingRight: hpadding, margin: "0 -8px" }}>
        <ButtonListItem
          gutterBottom
          onClick={openAddAssetDialog}
          style={{
            padding: `0 ${itemHPadding}px`,
            marginLeft: itemHMargin,
            marginRight: itemHMargin
          }}
        >
          <AddIcon />
          &nbsp;&nbsp;{t("account.balance-details.button.add-asset.label")}
        </ButtonListItem>
        <TrustedAssets
          account={props.account}
          accountData={accountData}
          assets={trustedAssets}
          hmargin={itemHMargin}
          hpadding={itemHPadding}
          onOpenAssetDetails={openAssetDetails}
          openOffers={openOrders}
          olderOffersAvailable={olderOffersAvailable}
        />
      </List>
      <Divider style={{ margin: "16px 0" }} />
      <List style={{ paddingLeft: hpadding, paddingRight: hpadding, margin: "0 -8px 8px" }}>
        {nativeBalance ? (
          <NativeBalanceItems
            account={props.account}
            accountData={accountData}
            balance={nativeBalance}
            hmargin={itemHMargin}
            hpadding={itemHPadding}
            onOpenAssetDetails={openAssetDetails}
          />
        ) : null}
      </List>
      <Dialog
        fullScreen
        open={addAssetDialogOpen || assetDetailsDialogOpen}
        onClose={closeAddAssetDialog}
        TransitionComponent={FullscreenDialogTransition}
      >
        <React.Suspense fallback={<ViewLoading />}>
          <AddAssetDialog
            account={props.account}
            accountData={accountData}
            hpadding={hpadding}
            itemHPadding={itemHPadding}
            onClose={closeAddAssetDialog}
          />
        </React.Suspense>
      </Dialog>
    </DialogBody>
  )
}

export default React.memo(BalanceDetailsDialog)
