import React from "react"
import { useTranslation, Trans } from "react-i18next"
import { ActionButton, ConfirmDialog } from "../Dialog/Generic"

interface NoPasswordConfirmationProps {
  onClose: () => void
  onConfirm: () => void
  open: boolean
}

function NoPasswordConfirmation(props: NoPasswordConfirmationProps) {
  const { t } = useTranslation()
  return (
    <ConfirmDialog
      cancelButton={<ActionButton onClick={props.onClose}>{t("create-account.actions.cancel")}</ActionButton>}
      confirmButton={
        <ActionButton onClick={props.onConfirm} type="primary">
          {t("create-account.actions.confirm")}
        </ActionButton>
      }
      onClose={props.onClose}
      open={props.open}
      title={t("create-account.confirm.title")}
    >
      <Trans i18nKey="create-account.confirm.text">
        You are about to create an account without password protection. Anyone that has access to your device will have
        access to your account funds. <br /> <br /> Are you sure you want to continue without setting up a password?
      </Trans>
    </ConfirmDialog>
  )
}

export default React.memo(NoPasswordConfirmation)
