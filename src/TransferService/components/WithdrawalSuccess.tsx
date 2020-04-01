import React from "react"
import { useTranslation } from "react-i18next"
import Typography from "@material-ui/core/Typography"
import { Withdrawal } from "@satoshipay/stellar-transfer"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { VerticalLayout } from "~Layout/components/Box"
import Portal from "~Generic/components/Portal"
import { TransferStates } from "../util/statemachine"
import { Paragraph, Summary } from "./Sidebar"

interface WithdrawalSuccessProps {
  dialogActionsRef: RefStateObject | undefined
  onClose: () => void
  state: TransferStates.TransferCompleted<Withdrawal>
}

function WithdrawalSuccess(props: WithdrawalSuccessProps) {
  const { transferServer } = props.state.withdrawal!
  const { t } = useTranslation()
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="24px 0" textAlign="center">
        <Typography variant="h5">{t("transfer-service.withdrawal-success.body.withdrawal-in-progress")}</Typography>
        <Typography style={{ margin: "16px 0" }} variant="body2">
          <Typography style={{ margin: "8px 0" }} variant="body2">
            {t(
              "transfer-service.withdrawal-success.body.info.1",
              `${transferServer.domain} is conducting the withdrawal.`,
              { domain: transferServer.domain }
            )}
          </Typography>
          <Typography style={{ margin: "8px 0" }} variant="body2">
            {t("transfer-service.withdrawal-success.body.info.2")}
          </Typography>
          {/* TODO: Show nice summary */}
        </Typography>
        <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
          <DialogActionsBox>
            <ActionButton onClick={props.onClose} type="primary">
              {t("transfer-service.withdrawal-success.action.close")}
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
    <Summary headline={t("transfer-service.withdrawal-success.sidebar.headline")}>
      <Paragraph>{t("transfer-service.withdrawal-success.sidebar.info")}</Paragraph>
    </Summary>
  )
}

const SuccessView = Object.assign(React.memo(WithdrawalSuccess), { Sidebar })

export default SuccessView
