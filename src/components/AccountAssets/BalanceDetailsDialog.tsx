import React from "react"
import { Asset, Horizon } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Divider from "@material-ui/core/Divider"
import IconButton from "@material-ui/core/IconButton"
import List from "@material-ui/core/List"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import RemoveIcon from "@material-ui/icons/Close"
import { Account } from "../../context/accounts"
import { useAccountData, useAssetMetadata, useIsMobile } from "../../hooks"
import { stringifyAsset } from "../../lib/stellar"
import DialogBody from "../Dialog/DialogBody"
import RemoveTrustlineDialog from "../Dialog/RemoveTrustline"
import MainTitle from "../MainTitle"
import BalanceDetailsListItem, { actionsSize } from "./BalanceDetailsListItem"
import SpendableBalanceBreakdown from "./SpendableBalanceBreakdown"

const DialogTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide ref={ref} {...props} direction="up" />
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
  const isLargeScreen = useMediaQuery("(min-width: 900px)")
  const isSmallScreen = useIsMobile()
  const [removalDialogAsset, setRemovalDialogAsset] = React.useState<Asset | null>(null)

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
  const hpadding = isSmallScreen ? 0 : 24
  const itemHPadding = isLargeScreen ? 16 : 0

  return (
    <DialogBody excessWidth={12} top={<MainTitle onBack={props.onClose} title={props.account.name} />}>
      <List style={{ paddingLeft: hpadding, paddingRight: hpadding }}>
        {trustedAssets.map(asset => {
          const [metadata] = assetMetadata.get(asset) || [undefined, false]
          return (
            <BalanceDetailsListItem
              key={stringifyAsset(asset)}
              actions={
                <IconButton onClick={() => removeTrustline(asset)} style={{ padding: 8 }}>
                  <RemoveIcon />
                </IconButton>
              }
              assetMetadata={metadata}
              balance={accountData.balances.find(balance => isAssetMatchingBalance(asset, balance))!}
              style={{ paddingLeft: itemHPadding, paddingRight: itemHPadding }}
              testnet={props.account.testnet}
            />
          )
        })}
        {trustedAssets.length > 0 ? <Divider style={{ margin: "8px 0" }} /> : null}
        {nativeBalance ? (
          <BalanceDetailsListItem
            key="XLM"
            balance={nativeBalance}
            style={{ paddingLeft: itemHPadding, paddingRight: itemHPadding, paddingBottom: 0 }}
            testnet={props.account.testnet}
          />
        ) : null}
        <SpendableBalanceBreakdown
          account={props.account}
          accountData={accountData}
          baseReserve={0.5}
          style={{ paddingLeft: itemHPadding, paddingRight: itemHPadding + actionsSize }}
        />
      </List>
      <Dialog
        open={removalDialogAsset !== null}
        onClose={closeRemoveTrustlineDialog}
        TransitionComponent={DialogTransition}
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
