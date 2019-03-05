import React from "react"
import { Asset, Operation, Server, Transaction } from "stellar-sdk"
import CloseIcon from "@material-ui/icons/Close"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { ObservedAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import TransactionSender from "../TransactionSender"
import { ActionButton, DialogActionsBox } from "./Generic"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface Props {
  account: Account
  accountData: ObservedAccountData
  asset: Asset
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function RemoveTrustlineDialog(props: Props) {
  const removeAsset = async () => {
    try {
      const operations = [Operation.changeTrust({ asset: props.asset, limit: "0" })]
      const transaction = await createTransaction(operations, {
        accountData: props.accountData,
        horizon: props.horizon,
        walletAccount: props.account
      })
      props.sendTransaction(transaction)
    } catch (error) {
      trackError(error)
    }
  }

  const assetBalance = props.accountData.balances.find((balance: any) => balance.asset_code === props.asset.code)
  const stillOwnsTokens = assetBalance && parseFloat(assetBalance.balance) > 0

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Confirm Removing Asset</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {stillOwnsTokens ? (
            <>You cannot remove this asset unless the asset's balance is zero.</>
          ) : (
            <>
              You are about to remove the asset <b>{props.asset.code}</b> from account "{props.account.name}
              ".
            </>
          )}
        </DialogContentText>
        <DialogActionsBox>
          <ActionButton onClick={props.onClose}>Cancel</ActionButton>
          <ActionButton autoFocus disabled={stillOwnsTokens} icon={<CloseIcon />} onClick={removeAsset} type="primary">
            Remove
          </ActionButton>
        </DialogActionsBox>
      </DialogContent>
    </Dialog>
  )
}

function ConnectedRemoveTrustlineDialog(props: Omit<Props, "balances" | "horizon" | "sendTransaction">) {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <RemoveTrustlineDialog
          {...props}
          accountData={props.accountData}
          horizon={horizon}
          sendTransaction={sendTransaction}
        />
      )}
    </TransactionSender>
  )
}

export default ConnectedRemoveTrustlineDialog
