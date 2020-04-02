import React from "react"
import { useTranslation } from "react-i18next"
import { ActionButton, ConfirmDialog } from "~Generic/components/DialogActions"

interface Props {
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}

function DismissalConfirmationDialog(props: Props) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      cancelButton={
        <ActionButton onClick={props.onCancel}>{t("account.transaction-review.dismissal.action.cancel")}</ActionButton>
      }
      confirmButton={
        <ActionButton onClick={props.onConfirm} type="primary">
          {t("account.transaction-review.dismissal.action.confirm")}
        </ActionButton>
      }
      onClose={props.onCancel}
      open={props.open}
      title={t("account.transaction-review.dismissal.title")}
    >
      {t("account.transaction-review.dismissal.header")}
    </ConfirmDialog>
  )
}

export default DismissalConfirmationDialog
