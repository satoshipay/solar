import React from "react"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import { Withdrawal } from "@satoshipay/stellar-transfer"
import { trackError } from "../../context/notifications"
import { RefStateObject } from "../../hooks/userinterface"
import { openLink } from "../../platform/links"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { Box, VerticalLayout } from "../Layout/Box"
import Portal from "../Portal"
import { TransferStates } from "./statemachine"
import { Paragraph, Summary } from "./Sidebar"
import TransferTransactionStatus from "./TransferTransactionStatus"
import { WithdrawalContext } from "./WithdrawalProvider"

interface WithdrawalKYCPendingProps {
  dialogActionsRef: RefStateObject | undefined
  state: TransferStates.KYCPending<Withdrawal>
}

function WithdrawalKYCPending(props: WithdrawalKYCPendingProps) {
  const { response } = props.state
  const { transferServer } = props.state.withdrawal!
  const { actions } = React.useContext(WithdrawalContext)

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    actions.didRedirectToKYC()

    if (response.data.type === "interactive_customer_info_needed") {
      openLink(response.data.url)
    } else {
      trackError(Error("Only interactive KYCs are supported."))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <VerticalLayout grow>
        <VerticalLayout alignItems="center" margin="24px auto" textAlign="center">
          <Typography variant="h5">Additional information needed</Typography>
          <TransferTransactionStatus domain={transferServer.domain} transaction={props.state.transfer} />
          {props.state.didRedirect ? (
            <Box grow margin="48px 0" textAlign="center">
              <CircularProgress />
            </Box>
          ) : null}
          <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
            <DialogActionsBox desktopStyle={{ justifyContent: "center" }}>
              <ActionButton type="submit">{props.state.didRedirect ? "Open again" : "Continue"}</ActionButton>
            </DialogActionsBox>
          </Portal>
        </VerticalLayout>
      </VerticalLayout>
    </form>
  )
}

const Sidebar = () => (
  <Summary headline="Know Your Customer">
    <Paragraph>The withdrawal service will only work if you provide personal information about you.</Paragraph>
    <Paragraph>This usually happens for legal reasons.</Paragraph>
  </Summary>
)

const KYCPendingView = Object.assign(React.memo(WithdrawalKYCPending), { Sidebar })

export default KYCPendingView
