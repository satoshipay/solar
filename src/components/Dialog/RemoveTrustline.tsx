import React from "react"
import { AccountResponse, Asset, Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import DialogActions from "@material-ui/core/DialogActions"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import RemoveIcon from "@material-ui/icons/RemoveCircle"
import { createTransaction } from "../../lib/transaction"
import { Account } from "../../stores/accounts"
import { addError } from "../../stores/notifications"
import ButtonIconLabel from "../ButtonIconLabel"
import { AccountData } from "../Subscribers"
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

class RemoveTrustlineDialog extends React.Component<Props> {
  removeAsset = async () => {
    try {
      const operations = [Operation.changeTrust({ asset: this.props.asset, limit: "0" })]
      const transaction = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })
      this.props.sendTransaction(transaction)
    } catch (error) {
      addError(error)
    }
  }

  render() {
    const assetBalance = this.props.balances.find((balance: any) => balance.asset_code === this.props.asset.code)
    const stillOwnsTokens = assetBalance && parseFloat(assetBalance.balance) > 0
    return (
      <Dialog open={this.props.open} onClose={this.props.onClose}>
        <DialogTitle>Confirm Removing Asset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {stillOwnsTokens ? (
              <>You cannot remove this asset unless the asset's balance is zero.</>
            ) : (
              <>
                You are about to remove the asset <b>{this.props.asset.code}</b> from account "{this.props.account.name}
                ".
              </>
            )}
          </DialogContentText>
          <DialogActions style={{ marginTop: 24 }}>
            <Button color="primary" onClick={this.props.onClose}>
              Cancel
            </Button>
            <Button autoFocus color="primary" variant="contained" disabled={stillOwnsTokens} onClick={this.removeAsset}>
              <ButtonIconLabel label="Remove">
                <RemoveIcon />
              </ButtonIconLabel>
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  }
}

const ConnectedRemoveTrustlineDialog = (props: Omit<Props, "balances" | "horizon" | "sendTransaction">) => {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender account={props.account} onSubmissionCompleted={closeAfterTimeout}>
      {({ horizon, sendTransaction }) => (
        <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
          {accountData => (
            <RemoveTrustlineDialog
              {...props}
              balances={accountData.balances}
              horizon={horizon}
              sendTransaction={sendTransaction}
            />
          )}
        </AccountData>
      )}
    </TransactionSender>
  )
}

export default ConnectedRemoveTrustlineDialog
