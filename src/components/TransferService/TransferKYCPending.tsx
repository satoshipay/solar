import nanoid from "nanoid"
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

  const formID = React.useMemo(() => nanoid(), [])

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
    actions.didRedirectToKYC()

    if (response.data.type === "interactive_customer_info_needed") {
      // tslint:disable-next-line no-console
      console.debug(`Opening anchor KYC page: ${response.data.url}`)
      openLink(response.data.url)
    } else {
      trackError(Error("Only interactive KYCs are supported."))
    }
  }

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <VerticalLayout grow>
        <VerticalLayout alignItems="center" margin="24px auto" textAlign="center">
          <Typography variant="h5">Additional information needed</Typography>
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
                {props.state.didRedirect ? "Open again" : "Continue"}
              </ActionButton>
            </DialogActionsBox>
          </Portal>
        </VerticalLayout>
      </VerticalLayout>
    </form>
  )
}

const Sidebar = () => (
  <Summary headline="Know Your Customer">
    <Paragraph>The service will only work if you provide personal information about you.</Paragraph>
    <Paragraph>This usually happens for legal reasons.</Paragraph>
  </Summary>
)

const KYCPendingView = Object.assign(React.memo(TransferKYCPending), { Sidebar })

export default KYCPendingView
