import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import Dialog from "@material-ui/core/Dialog"
import Slide from "@material-ui/core/Slide"
import { TransitionProps } from "@material-ui/core/transitions"
import AddIcon from "@material-ui/icons/Add"
import ClearIcon from "@material-ui/icons/Clear"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import { DialogActionsBox, ActionButton } from "../Dialog/Generic"
import TransactionSender from "../TransactionSender"
import RemoveTrustlineDialog from "./RemoveTrustline"

const DialogVerticalTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide {...props} direction="up" ref={ref} />
))

const dialogActionsBoxStyle: React.CSSProperties = {
  marginTop: 8
}

interface Props {
  account: Account
  asset: Asset
  horizon: Server
  sendTransaction: (transaction: Transaction, signatureRequest?: null) => void
}

function AssetDetailsActions(props: Props) {
  const { account, asset } = props
  const [removalDialogOpen, setRemovalDialogOpen] = React.useState(false)
  const [txCreationPending, setTxCreationPending] = React.useState(false)

  const accountData = useAccountData(account.publicKey, account.testnet)

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

  const sendTransaction = async (createTransactionToSend: () => Promise<Transaction>) => {
    try {
      setTxCreationPending(true)
      const transaction = await createTransactionToSend()
      setTxCreationPending(false)
      await props.sendTransaction(transaction)
      closeRemovalDialog()
    } catch (error) {
      setTxCreationPending(false)
      trackError(error)
    }
  }

  const addThisAsset = () => sendTransaction(() => createAddAssetTransaction())
  const closeRemovalDialog = React.useCallback(() => setRemovalDialogOpen(false), [])
  const removeThisAsset = React.useCallback(() => setRemovalDialogOpen(true), [])

  return (
    <>
      <DialogActionsBox desktopStyle={dialogActionsBoxStyle} smallDialog>
        {balance ? (
          <ActionButton icon={<ClearIcon />} onClick={removeThisAsset} type="primary">
            Remove asset
          </ActionButton>
        ) : (
          <ActionButton icon={<AddIcon />} loading={txCreationPending} onClick={addThisAsset} type="primary">
            Add asset
          </ActionButton>
        )}
      </DialogActionsBox>
      <Dialog open={removalDialogOpen} onClose={closeRemovalDialog} TransitionComponent={DialogVerticalTransition}>
        <RemoveTrustlineDialog
          account={props.account}
          accountData={accountData}
          asset={asset}
          onClose={closeRemovalDialog}
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
