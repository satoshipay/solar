import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Asset, Horizon, Operation, Server } from "stellar-sdk"
import CloseIcon from "@material-ui/icons/Close"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogTitle from "@material-ui/core/DialogTitle"
import { Account } from "~App/context/accounts"
import { trackError } from "~App/context/notifications"
import { AccountData } from "~Generic/lib/account"
import { createTransaction } from "~Generic/lib/transaction"
import { ActionButton, DialogActionsBox } from "~Dialog/components/Generic"
import TransactionSender, { SendTransaction } from "~Transaction/components/TransactionSender"

interface Props {
  account: Account
  accountData: AccountData
  asset: Asset
  horizon: Server
  onClose: () => void
  onRemoved: () => void
  sendTransaction: SendTransaction
}

// tslint:disable-next-line no-shadowed-variable
const RemoveTrustlineDialog = React.memo(function RemoveTrustlineDialog(props: Props) {
  const { t } = useTranslation()

  const removeAsset = async () => {
    try {
      const operations = [Operation.changeTrust({ asset: props.asset, limit: "0" })]
      const transaction = await createTransaction(operations, {
        accountData: props.accountData,
        horizon: props.horizon,
        walletAccount: props.account
      })
      await props.sendTransaction(transaction)
      props.onRemoved()
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
      <DialogTitle>{t("account.remove-trustline.title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {stillOwnsTokens ? (
            <>{t("account.remove-trustline.text.warning")}</>
          ) : (
            <Trans i18nKey="account.remove-trustline.text.info">
              You are about to remove <b>{{ asset: props.asset.code }}</b> from account "
              {{ accountName: props.account.name }}".
            </Trans>
          )}
        </DialogContentText>
        {/* Not in the DialogBody's `actions` prop as it's not a fullscreen dialog */}
        <DialogActionsBox preventMobileActionsBox>
          <ActionButton onClick={props.onClose} style={{ maxWidth: "none" }}>
            {t("account.remove-trustline.action.cancel")}
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
              {t("account.remove-trustline.action.remove")}
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

export default React.memo(ConnectedRemoveTrustlineDialog)
