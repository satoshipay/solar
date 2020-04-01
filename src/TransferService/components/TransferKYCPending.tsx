import nanoid from "nanoid"
import React from "react"
import { useTranslation } from "react-i18next"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import { Withdrawal } from "@satoshipay/stellar-transfer"
import { trackError } from "~App/contexts/notifications"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { openLink } from "~Platform/links"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { CustomError } from "~Generic/lib/errors"
import { Box, VerticalLayout } from "~Layout/components/Box"
import Portal from "~Generic/components/Portal"
import { TransferStates } from "../util/statemachine"
import { DepositContext } from "./DepositProvider"
import { Paragraph, Summary } from "./Sidebar"
import TransferTransactionStatus from "./TransferTransactionStatus"
import { WithdrawalContext } from "./WithdrawalProvider"

interface TransferKYCPendingProps {
  dialogActionsRef: RefStateObject | undefined
  state: TransferStates.KYCPending<Withdrawal>
  type: "deposit" | "withdrawal"
}

function TransferKYCPending(props: TransferKYCPendingProps) {
  const { response } = props.state
  const { transferServer } = props.type === "deposit" ? props.state.deposit! : props.state.withdrawal!
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { actions } = props.type === "deposit" ? React.useContext(DepositContext) : React.useContext(WithdrawalContext)
  const { t } = useTranslation()

  const formID = React.useMemo(() => nanoid(), [])

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    actions.didRedirectToKYC()

    if (response.data.type === "interactive_customer_info_needed") {
      // tslint:disable-next-line no-console
      console.debug(`Opening anchor KYC page: ${response.data.url}`)
      openLink(response.data.url)
    } else {
      trackError(CustomError("OnlyInteractiveKycSupportedError", "Only interactive KYCs are supported."))
    }
  }

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <VerticalLayout grow>
        <VerticalLayout alignItems="center" margin="24px auto" textAlign="center">
          <Typography variant="h5">{t("transfer-service.kyc-pending.body.additional-info-needed")}</Typography>
          <TransferTransactionStatus
            domain={transferServer.domain}
            transaction={props.state.transfer}
            type={props.type}
          />
          {props.state.didRedirect ? (
            <Box grow margin="48px 0" textAlign="center">
              <CircularProgress />
            </Box>
          ) : null}
          <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
            <DialogActionsBox desktopStyle={{ justifyContent: "center", marginTop: 16 }}>
              <ActionButton form={formID} type="submit">
                {props.state.didRedirect
                  ? t("transfer-service.kyc-pending.action.open-again")
                  : t("transfer-service.kyc-pending.action.continue")}
              </ActionButton>
            </DialogActionsBox>
          </Portal>
        </VerticalLayout>
      </VerticalLayout>
    </form>
  )
}

const Sidebar = () => {
  const { t } = useTranslation()
  return (
    <Summary headline={t("transfer-service.kyc-pending.sidebar.headline")}>
      <Paragraph>{t("transfer-service.kyc-pending.sidebar.info.1")}</Paragraph>
      <Paragraph>{t("transfer-service.kyc-pending.sidebar.info.2")}</Paragraph>
    </Summary>
  )
}

const KYCPendingView = Object.assign(React.memo(TransferKYCPending), { Sidebar })

export default KYCPendingView
