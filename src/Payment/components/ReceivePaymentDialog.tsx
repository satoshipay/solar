import Typography from "@material-ui/core/Typography"
import React from "react"
import { useTranslation } from "react-i18next"
import { Account } from "~App/contexts/accounts"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { Box } from "~Layout/components/Box"
import DialogBody from "~Layout/components/DialogBody"
import KeyExportBox from "~Account/components/KeyExportBox"
import MainTitle from "~Generic/components/MainTitle"

interface Props {
  account: Account
  onClose: () => void
}

function ReceivePaymentDialog(props: Props) {
  const isSmallScreen = useIsMobile()
  const { t } = useTranslation()

  return (
    <DialogBody top={<MainTitle onBack={props.onClose} title={t("payment.title.receive")} />}>
      <Box width="100%" margin="32px auto">
        <KeyExportBox export={props.account.accountID} size={isSmallScreen ? 192 : 256} />
      </Box>
      {props.account.accountID === props.account.publicKey ? null : (
        <Typography align="center" color="textSecondary">
          {t("payment.note.multisig-pubkey")}
        </Typography>
      )}
    </DialogBody>
  )
}

export default React.memo(ReceivePaymentDialog)
