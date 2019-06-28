import React from "react"
import { Asset, Horizon, Operation, Server, Transaction } from "stellar-sdk"
import CloseIcon from "@material-ui/icons/Close"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { ObservedAccountData } from "../../hooks"
import { createTransaction } from "../../lib/transaction"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import TransactionSender from "../TransactionSender"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface Props {
  account: Account
  accountData: ObservedAccountData
  asset: Asset
  horizon: Server
  onClose: () => void
  sendTransaction: (account: Account, transaction: Transaction) => Promise<any>
}

// tslint:disable-next-line no-shadowed-variable
const RemoveTrustlineDialog = React.memo(function RemoveTrustlineDialog(props: Props) {
  const removeAsset = async () => {
    try {
      const operations = [Operation.changeTrust({ asset: props.asset, limit: "0" })]
      const transaction = await createTransaction(operations, {
        accountData: props.accountData,
        horizon: props.horizon,
        walletAccount: props.account
      })
      props.sendTransaction(props.account, transaction)
    } catch (error) {
      trackError(error)
    }
  }

  const assetBalance = (props.accountData.balances as Horizon.BalanceLineAsset[]).find(
    balance => balance.asset_code === props.asset.getCode() && balance.asset_issuer === props.asset.getIssuer()
  )
  const stillOwnsTokens = assetBalance && parseFloat(assetBalance.balance) > 0

  return (
    <>
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
        {/* Not in the DialogBody's `actions` prop as it's not a fullscreen dialog */}
        <DialogActionsBox preventMobileActionsBox>
          <ActionButton onClick={props.onClose} style={{ maxWidth: "none" }}>
            Cancel
          </ActionButton>
          {stillOwnsTokens ? null : (
            <ActionButton
              autoFocus
              disabled={stillOwnsTokens}
              icon={<CloseIcon />}
              onClick={removeAsset}
              style={{ maxWidth: "none" }}
              type="primary"
            >
              Remove
            </ActionButton>
          )}
        </DialogActionsBox>
      </DialogContent>
    </>
  )
})

function ConnectedRemoveTrustlineDialog(props: Omit<Props, "balances" | "horizon" | "sendTransaction">) {
  const closeAfterTimeout = () => {
    // Close automatically a second after successful submission
    setTimeout(() => props.onClose(), 1000)
  }
  return (
    <TransactionSender testnet={props.account.testnet} onSubmissionCompleted={closeAfterTimeout}>
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

export default React.memo(ConnectedRemoveTrustlineDialog)
