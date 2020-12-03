import React from "react"
import { useTranslation } from "react-i18next"
import Box from "@material-ui/core/Box"
import Typography from "@material-ui/core/Typography"
import TrustIcon from "@material-ui/icons/Check"
import DenyIcon from "@material-ui/icons/Cancel"
import WarnIcon from "@material-ui/icons/Warning"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import MainTitle from "~Generic/components/MainTitle"
import DialogBody from "~Layout/components/DialogBody"

interface VerifyTrustedServiceDialogProps {
  onTrust: () => void
  onCancel: () => void
  domain: string
}

function VerifyTrustedServiceDialog(props: VerifyTrustedServiceDialogProps) {
  const { t } = useTranslation()

  const { onTrust, onCancel } = props

  return (
    <DialogBody
      background={<WarnIcon style={{ fontSize: 220 }} />}
      preventNotchSpacing
      top={<MainTitle hideBackButton onBack={onCancel} title={t("transaction-request.verify-trusted-service.title")} />}
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<TrustIcon />} onClick={onTrust} type="secondary">
            {t("transaction-request.verify-trusted-service.action.trust")}
          </ActionButton>
          <ActionButton icon={<DenyIcon />} onClick={onCancel} type="primary">
            {t("transaction-request.verify-trusted-service.action.cancel")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box padding="24px 0 0">
        <Typography variant="body1">{t("transaction-request.verify-trusted-service.info.1")}:</Typography>
        <Typography align="center" color="textPrimary" variant="h6" style={{ paddingTop: 32, paddingBottom: 32 }}>
          {props.domain}
        </Typography>
        <Typography variant="body1">{t("transaction-request.verify-trusted-service.info.2")}</Typography>
        <Typography variant="body1">{t("transaction-request.verify-trusted-service.info.3")}</Typography>
      </Box>
    </DialogBody>
  )
}

export default VerifyTrustedServiceDialog
