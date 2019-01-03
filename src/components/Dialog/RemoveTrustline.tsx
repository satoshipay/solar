import React from "react"
import { AccountResponse, Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import CloseIcon from "@material-ui/icons/Close"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import ButtonIconLabel from "../ButtonIconLabel"
import TransactionSender from "../TransactionSender"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface Props {
  account: Account
  asset: Asset
  balances: AccountResponse["balances"]
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
        horizon: props.horizon,
        walletAccount: props.account
      })
      props.sendTransaction(transaction)
    } catch (error) {
      trackError(error)
    }
  }

  const assetBalance = props.balances.find((balance: any) => balance.asset_code === props.asset.code)
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
        <DialogActions style={{ marginTop: 24 }}>
          <Button autoFocus color="primary" variant="contained" disabled={stillOwnsTokens} onClick={removeAsset}>
            <ButtonIconLabel label="Remove">
              <CloseIcon />
            </ButtonIconLabel>
          </Button>
          <Button color="primary" onClick={props.onClose}>
            Cancel
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

function ConnectedRemoveTrustlineDialog(props: Omit<Props, "balances" | "horizon" | "sendTransaction">) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)

  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <RemoveTrustlineDialog
          {...props}
          balances={accountData.balances}
          horizon={horizon}
          sendTransaction={sendTransaction}
        />
      )}
    </TransactionSender>
  )
}

export default ConnectedRemoveTrustlineDialog
