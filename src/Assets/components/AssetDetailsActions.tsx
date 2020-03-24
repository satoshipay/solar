import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import ClearIcon from "@material-ui/icons/Clear"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import { Account } from "~App/context/accounts"
import { trackError } from "~App/context/notifications"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useRouter } from "~Generic/hooks/userinterface"
import { createTransaction } from "~Generic/lib/transaction"
import * as routes from "../../routes"
import { CompactDialogTransition } from "~App/theme"
import { stringifyAsset } from "~Generic/lib/stellar"
import { DialogActionsBox, ActionButton } from "~Dialog/components/Generic"
import TransactionSender, { SendTransaction } from "~Transaction/components/TransactionSender"
import RemoveTrustlineDialog from "./RemoveTrustline"

const dialogActionsBoxStyle: React.CSSProperties = {
  marginTop: 8
}

interface Props {
  account: Account
  asset: Asset
  horizon: Server
  sendTransaction: SendTransaction
}

function AssetDetailsActions(props: Props) {
  const { account, asset } = props
  const [removalDialogOpen, setRemovalDialogOpen] = React.useState(false)
  const [txCreationPending, setTxCreationPending] = React.useState(false)
  const router = useRouter()

  const accountData = useLiveAccountData(account.publicKey, account.testnet)

  const balance = accountData.balances.find(
    bal => bal.asset_type !== "native" && bal.asset_issuer === asset.issuer && bal.asset_code === asset.code
  )

  const createAddAssetTransaction = async (options: { limit?: string } = {}) => {
    const operations = [Operation.changeTrust({ asset, limit: options.limit })]
    return createTransaction(operations, {
      accountData,
      horizon: props.horizon,
      walletAccount: props.account
    })
  }

  const navigateBackDelayed = React.useCallback(() => {
    setTimeout(() => router.history.push(routes.account(props.account.id)), 1300)
  }, [props.account, router.history])

  const sendTransaction = async (createTransactionToSend: () => Promise<Transaction>) => {
    try {
      setTxCreationPending(true)
      const transaction = await createTransactionToSend()
      setTxCreationPending(false)
      await props.sendTransaction(transaction)
      closeRemovalDialog()
      navigateBackDelayed()
    } catch (error) {
      setTxCreationPending(false)
      trackError(error)
    }
  }

  const addThisAsset = () => sendTransaction(() => createAddAssetTransaction())
  const closeRemovalDialog = React.useCallback(() => setRemovalDialogOpen(false), [])
  const removeThisAsset = React.useCallback(() => setRemovalDialogOpen(true), [])

  const tradeThisAsset = React.useCallback(
    () => router.history.push(routes.tradeAsset(props.account.id, undefined, stringifyAsset(asset))),
    [asset, props.account.id, router.history]
  )

  return (
    <>
      <DialogActionsBox desktopStyle={dialogActionsBoxStyle} smallDialog>
        {balance ? (
          <>
            <ActionButton icon={<ClearIcon />} onClick={removeThisAsset} type="secondary">
              Remove
            </ActionButton>
            <ActionButton icon={<SwapHorizIcon />} onClick={tradeThisAsset} type="primary">
              Trade
            </ActionButton>
          </>
        ) : (
          <ActionButton loading={txCreationPending} onClick={addThisAsset} type="primary">
            Add asset to account
          </ActionButton>
        )}
      </DialogActionsBox>
      <Dialog open={removalDialogOpen} onClose={closeRemovalDialog} TransitionComponent={CompactDialogTransition}>
        <RemoveTrustlineDialog
          account={props.account}
          accountData={accountData}
          asset={asset}
          onClose={closeRemovalDialog}
          onRemoved={navigateBackDelayed}
        />
      </Dialog>
    </>
  )
}

function ConnectedAssetDetailsActions(props: Omit<Props, "horizon" | "sendTransaction">) {
  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <AssetDetailsActions {...props} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default React.memo(ConnectedAssetDetailsActions)
