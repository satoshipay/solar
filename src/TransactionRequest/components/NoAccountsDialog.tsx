import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import CancelIcon from "@material-ui/icons/Close"
import React from "react"
import { useTranslation } from "react-i18next"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import MainTitle from "~Generic/components/MainTitle"
import TestnetBadge from "~Generic/components/TestnetBadge"
import DialogBody from "~Layout/components/DialogBody"

interface Props {
  onClose: () => void
  testnet: boolean
}

function NoAccountsDialog(props: Props) {
  const { t } = useTranslation()
  return (
    <DialogBody
      preventNotchSpacing
      top={
        <MainTitle
          hideBackButton
          onBack={props.onClose}
          title={
            <span>
              {t("transaction-request.no-accounts.title")}
              {props.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
            </span>
          }
        />
      }
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<CancelIcon />} onClick={props.onClose} type="secondary">
            {t("transaction-request.no-accounts.action.dismiss")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box>
        <Typography>{t("transaction-request.no-accounts.info.1")}</Typography>
        <Typography>{t("transaction-request.no-accounts.info.2")}</Typography>
      </Box>
    </DialogBody>
  )
}

export default NoAccountsDialog
