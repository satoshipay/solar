import React from "react"
import { useTranslation, Trans } from "react-i18next"
import { ActionButton, ConfirmDialog } from "~Generic/components/DialogActions"

interface WeakPasswordConfirmationProps {
  onClose: () => void
  onConfirm: () => void
  open: boolean
}

function WeakPasswordConfirmation(props: WeakPasswordConfirmationProps) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      cancelButton={<ActionButton onClick={props.onClose}>{t("create-account.action.cancel")}</ActionButton>}
      confirmButton={
        <ActionButton onClick={props.onConfirm} type="primary">
          {t("create-account.action.confirm")}
        </ActionButton>
      }
      onClose={props.onClose}
      open={props.open}
      title={t("create-account.confirm-weak-password.title")}
    >
      <Trans i18nKey="create-account.confirm-weak-password.text">
        You are about to protect this account with a weak password. Anyone that has access to your device will have
        access to your account funds. <br /> <br /> Are you sure you want to continue without setting up a strong
        password?
      </Trans>
    </ConfirmDialog>
  )
}

export default React.memo(WeakPasswordConfirmation)
