import React from "react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import { DepositTransaction, TransferStatus, WithdrawalTransaction } from "@satoshipay/stellar-sep-6"
import ButtonIconLabel from "../ButtonIconLabel"
import { Box, VerticalLayout } from "../Layout/Box"
import { formatDuration } from "./formatters"

interface TransferTransactionStatusProps {
  onCancel: () => void
  transaction?: DepositTransaction | WithdrawalTransaction
}

function TransferTransactionStatus(props: TransferTransactionStatusProps) {
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="48px auto 0" maxWidth="550px" textAlign="center" width="80%">
        {!props.transaction || props.transaction.status === TransferStatus.incomplete ? (
          <>
            <Typography variant="h5">Customer information check in progress</Typography>
            <Typography style={{ margin: "8px 0 0" }} variant="body2">
              The anchor responsible for this operation is checking your personal information. Please try again later.
            </Typography>
            {props.transaction && props.transaction.status_eta ? (
              <Typography style={{ margin: "8px 0 0" }} variant="body2">
                Estimated time to completion: {formatDuration(props.transaction.status_eta)}
              </Typography>
            ) : null}
          </>
        ) : null}
        {props.transaction && props.transaction.status === TransferStatus.error ? (
          <>
            <Typography variant="h5">Withdrawal failed</Typography>
            <Typography style={{ margin: "8px 0 0" }} variant="body2">
              {props.transaction.message}
            </Typography>
            <Typography style={{ margin: "8px 0 0" }} variant="body2">
              Please contact the anchor.
            </Typography>
          </>
        ) : null}
        {props.transaction && props.transaction.more_info_url ? (
          <Typography style={{ margin: "8px 0 0" }} variant="body2">
            For more information, visit{" "}
            <a href={props.transaction.more_info_url} target="_blank">
              {props.transaction.more_info_url}
            </a>
          </Typography>
        ) : null}
      </VerticalLayout>
      <Box grow margin="24px 0 64px">
        {null}
      </Box>
      <Box>
        <Button onClick={props.onCancel} variant="text">
          <ButtonIconLabel label="Back" style={{ paddingRight: 8 }}>
            <ChevronLeftIcon />
          </ButtonIconLabel>
        </Button>
      </Box>
    </VerticalLayout>
  )
}

export default React.memo(TransferTransactionStatus)
