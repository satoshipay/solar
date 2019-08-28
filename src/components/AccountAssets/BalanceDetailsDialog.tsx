import BigNumber from "big.js"
import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Divider from "@material-ui/core/Divider"
import IconButton from "@material-ui/core/IconButton"
import List from "@material-ui/core/List"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import AddIcon from "@material-ui/icons/Add"
import RemoveIcon from "@material-ui/icons/Close"
import { Account } from "../../context/accounts"
import { useAccountData, useAccountOffers, useAssetMetadata, useIsMobile, useRouter } from "../../hooks"
import { stringifyAsset, getAccountMinimumBalance } from "../../lib/stellar"
import * as routes from "../../routes"
import DialogBody from "../Dialog/DialogBody"
import MainTitle from "../MainTitle"
import AddAssetDialog from "./AddAssetDialog"
import BalanceDetailsListItem from "./BalanceDetailsListItem"
import ButtonListItem from "./ButtonListItem"
import RemoveTrustlineDialog from "./RemoveTrustline"

const DialogHorizontalTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide {...props} direction="left" ref={ref} />
))
const DialogVerticalTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide {...props} direction="up" ref={ref} />
))

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

  const [removalDialogAsset, setRemovalDialogAsset] = React.useState<Asset | null>(null)

  const openAddAssetDialog = () => router.history.push(routes.manageAccountAssets(props.account.id))
  const closeAddAssetDialog = () => router.history.push(routes.balanceDetails(props.account.id))
  const addAssetDialogOpen = router.location.pathname.startsWith(routes.manageAccountAssets(props.account.id))

  const openAssetDetails = (asset: Asset) =>
    router.history.push(routes.assetDetails(props.account.id, stringifyAsset(asset)))

  const { closeRemoveTrustlineDialog, removeTrustline } = React.useMemo(
    () => ({
      closeRemoveTrustlineDialog: () => setRemovalDialogAsset(null),
      removeTrustline: (asset: Asset) => setRemovalDialogAsset(asset)
    }),
    []
  )

  const trustedAssets = accountData.balances
    .filter((balance): balance is Horizon.BalanceLineAsset => balance.asset_type !== "native")
    .map(balance => new Asset(balance.asset_code, balance.asset_issuer))

  const nativeBalance = accountData.balances.find(
    (balance): balance is Horizon.BalanceLineNative => balance.asset_type === "native"
  )

  const assetMetadata = useAssetMetadata(trustedAssets, props.account.testnet)
  const hpadding = isSmallScreen ? 0 : 8
  const itemHPadding = isSmallScreen ? 0 : 16

  return (
    <DialogBody excessWidth={12} top={<MainTitle onBack={props.onClose} title={props.account.name} />}>
      <List style={{ paddingLeft: hpadding, paddingRight: hpadding }}>
        <ButtonListItem
          onClick={openAddAssetDialog}
          style={{
            boxSizing: "content-box",
            padding: `0 ${itemHPadding}px`,
            marginLeft: -itemHPadding,
            marginRight: -itemHPadding
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
              actions={
                <IconButton onClick={() => removeTrustline(asset)} style={{ padding: 8 }}>
                  <RemoveIcon />
                </IconButton>
              }
              assetMetadata={metadata}
              badgeCount={openOffers.length}
              balance={balance!}
              onClick={() => openAssetDetails(asset)}
              style={{
                boxSizing: "content-box",
                paddingLeft: itemHPadding,
                paddingRight: itemHPadding,
                marginLeft: -itemHPadding,
                marginRight: -itemHPadding
              }}
              testnet={props.account.testnet}
            />
          )
        })}
        <Divider style={{ margin: "16px 0" }} />
        {nativeBalance ? (
          <>
            <BalanceDetailsListItem
              key="XLM"
              balance={nativeBalance}
              onClick={() => openAssetDetails(Asset.native())}
              style={{
                boxSizing: "content-box",
                paddingLeft: itemHPadding,
                paddingRight: itemHPadding,
                marginLeft: -itemHPadding,
                marginRight: -itemHPadding
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
              spendableBalance
              style={{
                boxSizing: "content-box",
                marginTop: -8,
                paddingLeft: itemHPadding,
                paddingRight: itemHPadding,
                marginLeft: -itemHPadding,
                marginRight: -itemHPadding
              }}
              testnet={props.account.testnet}
            />
          </>
        ) : null}
      </List>
      <Dialog
        fullScreen
        open={addAssetDialogOpen}
        onClose={closeAddAssetDialog}
        TransitionComponent={DialogHorizontalTransition}
      >
        <AddAssetDialog
          account={props.account}
          accountData={accountData}
          hpadding={hpadding}
          itemHPadding={itemHPadding}
          onClose={closeAddAssetDialog}
        />
      </Dialog>
      <Dialog
        open={removalDialogAsset !== null}
        onClose={closeRemoveTrustlineDialog}
        TransitionComponent={DialogVerticalTransition}
      >
        <RemoveTrustlineDialog
          account={props.account}
          accountData={accountData}
          asset={removalDialogAsset || Asset.native()}
          onClose={closeRemoveTrustlineDialog}
        />
      </Dialog>
    </DialogBody>
  )
}

export default React.memo(BalanceDetailsDialog)
