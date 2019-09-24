import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import AddIcon from "@material-ui/icons/Add"
import { Account } from "../../context/accounts"
import { useIsMobile, useRouter } from "../../hooks/userinterface"
import { useAssetMetadata } from "../../hooks/stellar"
import { useAccountData, useAccountOffers } from "../../hooks/stellar-subscriptions"
import { matchesRoute } from "../../lib/routes"
import { stringifyAsset, getAccountMinimumBalance } from "../../lib/stellar"
import * as routes from "../../routes"
import { FullscreenDialogTransition } from "../../theme"
import { sortBalances } from "../Account/AccountBalances"
import DialogBody from "../Dialog/DialogBody"
import MainTitle from "../MainTitle"
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

interface BalanceDetailsProps {
  account: Account
  onClose: () => void
}

function BalanceDetailsDialog(props: BalanceDetailsProps) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const accountOffers = useAccountOffers(props.account.publicKey, props.account.testnet)
  const isSmallScreen = useIsMobile()
  const router = useRouter()

  const openAddAssetDialog = React.useCallback(
    () => router.history.push(routes.manageAccountAssets(props.account.id)),
    [props.account.id]
  )
  const closeAddAssetDialog = React.useCallback(() => router.history.push(routes.balanceDetails(props.account.id)), [
    props.account.id
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

  const assetMetadata = useAssetMetadata(trustedAssets, props.account.testnet)
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
          &nbsp;&nbsp;Add Asset To Your Account
        </ButtonListItem>
        {trustedAssets.map(asset => {
          const [metadata] = assetMetadata.get(asset) || [undefined, false]
          const balance = accountData.balances.find(bal => isAssetMatchingBalance(asset, bal))
          const openOffers = accountOffers.offers.filter(
            offer =>
              (offer.buying.asset_code === asset.code && offer.buying.asset_issuer === asset.issuer) ||
              (offer.selling.asset_code === asset.code && offer.selling.asset_issuer === asset.issuer)
          )
          return (
            <BalanceDetailsListItem
              key={stringifyAsset(asset)}
              assetMetadata={metadata}
              badgeCount={openOffers.length}
              balance={balance!}
              onClick={() => openAssetDetails(asset)}
              style={{
                paddingLeft: itemHPadding,
                paddingRight: itemHPadding,
                marginLeft: itemHMargin,
                marginRight: itemHMargin
              }}
              testnet={props.account.testnet}
            />
          )
        })}
      </List>
      <Divider style={{ margin: "16px 0" }} />
      <List style={{ paddingLeft: hpadding, paddingRight: hpadding, margin: "0 -8px 8px" }}>
        {nativeBalance ? (
          <>
            <BalanceDetailsListItem
              key="XLM"
              balance={nativeBalance}
              onClick={() => openAssetDetails(Asset.native())}
              style={{
                paddingLeft: itemHPadding,
                paddingRight: itemHPadding,
                marginLeft: itemHMargin,
                marginRight: itemHMargin
              }}
              testnet={props.account.testnet}
            />
            <BalanceDetailsListItem
              key="XLM:spendable"
              balance={{
                ...nativeBalance,
                balance: BigNumber(nativeBalance.balance).eq(0)
                  ? "0"
                  : BigNumber(nativeBalance.balance)
                      .minus(getAccountMinimumBalance(accountData, accountOffers.offers.length))
                      .toString()
              }}
              hideLogo
              onClick={() => openAssetDetails(Asset.native())}
              spendableBalance
              style={{
                marginTop: -8,
                paddingLeft: itemHPadding,
                paddingRight: itemHPadding,
                marginLeft: itemHMargin,
                marginRight: itemHMargin
              }}
              testnet={props.account.testnet}
            />
          </>
        ) : null}
      </List>
      <Dialog
        fullScreen
        open={addAssetDialogOpen || assetDetailsDialogOpen}
        onClose={closeAddAssetDialog}
        TransitionComponent={FullscreenDialogTransition}
      >
        <AddAssetDialog
          account={props.account}
          accountData={accountData}
          hpadding={hpadding}
          itemHPadding={itemHPadding}
          onClose={closeAddAssetDialog}
        />
      </Dialog>
    </DialogBody>
  )
}

export default React.memo(BalanceDetailsDialog)
