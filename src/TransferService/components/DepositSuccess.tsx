import React from "react"
import { useTranslation } from "react-i18next"
import Typography from "@material-ui/core/Typography"
import { Deposit } from "@satoshipay/stellar-transfer"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { VerticalLayout } from "~Layout/components/Box"
import Portal from "~Generic/components/Portal"
import { TransferStates } from "../util/statemachine"
import { Paragraph, Summary } from "./Sidebar"

interface DepositSuccessProps {
  dialogActionsRef: RefStateObject | undefined
  onClose: () => void
  state: TransferStates.TransferCompleted<Deposit>
}

function DepositSuccess(props: DepositSuccessProps) {
  const { transferServer } = props.state.deposit!
  const { t } = useTranslation()
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="24px 0" textAlign="center">
        <Typography variant="h5">{t("transfer-service.deposit-success.body.deposit-pending")}</Typography>
        <Typography style={{ margin: "16px 0" }} variant="body2">
          <Typography style={{ margin: "8px 0" }} variant="body2">
            {t(
              "transfer-service.deposit-success.body.info.1",
              `${transferServer.domain} is waiting for your deposit.`,
              { domain: transferServer.domain }
            )}
          </Typography>
          <Typography style={{ margin: "8px 0" }} variant="body2">
            {t("transfer-service.deposit-success.body.info.2")}
          </Typography>
          {/* TODO: Show nice summary */}
        </Typography>
        <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton onClick={props.onClose} type="primary">
              {t("transfer-service.deposit-success.action.close")}
            </ActionButton>
          </DialogActionsBox>
        </Portal>
      </VerticalLayout>
    </VerticalLayout>
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  return (
    <Summary headline={t("transfer-service.deposit-success.sidebar.headline")}>
      <Paragraph>{t("transfer-service.deposit-success.sidebar.info")}</Paragraph>
    </Summary>
  )
}

const SuccessView = Object.assign(React.memo(DepositSuccess), { Sidebar })

export default SuccessView
