import React from "react"
import Typography from "@material-ui/core/Typography"
import { DepositTransaction, TransferStatus, WithdrawalTransaction } from "@satoshipay/stellar-transfer"
import { VerticalLayout } from "../Layout/Box"
import { formatDuration } from "./formatters"

function Paragraph(props: { children: React.ReactNode }) {
  return (
    <Typography style={{ margin: "8px 0" }} variant="body2">
      {props.children}
    </Typography>
  )
}

interface TransferTransactionStatusProps {
  didRedirectAlready?: boolean
  domain: string
  transaction: DepositTransaction | WithdrawalTransaction | undefined
  type: "deposit" | "withdrawal"
}

function TransferTransactionStatus(props: TransferTransactionStatusProps) {
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="16px auto" textAlign="center">
        {(() => {
          if (!props.transaction || props.transaction.status === TransferStatus.incomplete) {
            return props.didRedirectAlready ? (
              <>
                <Paragraph>{props.domain} is checking your personal information. Please try again later.</Paragraph>
                {props.transaction && props.transaction.status_eta ? (
                  <Paragraph>Estimated time to completion: {formatDuration(props.transaction.status_eta)}</Paragraph>
                ) : null}
              </>
            ) : (
              <Paragraph>{props.domain} requires you to provide additional information.</Paragraph>
            )
          } else if (props.transaction.status === TransferStatus.error) {
            return (
              <>
                <Paragraph>
                  ${props.type === "deposit" ? "Deposit rejected" : "Withdrawal rejected"} – {props.transaction.message}
                </Paragraph>
                <Paragraph>Please contact {props.domain}.</Paragraph>
              </>
            )
          } else if (props.transaction.status === TransferStatus.pending_user_transfer_start) {
            return <Paragraph>{props.domain} requires further information from you.</Paragraph>
          } else if (props.transaction.more_info_url) {
            return (
              <Paragraph>
                For more information, visit
                <br />
                <a href={props.transaction.more_info_url} target="_blank" rel="noopener noreferrer">
                  {props.transaction.more_info_url}
                </a>
              </Paragraph>
            )
          } else {
            return null
          }
        })()}
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default React.memo(TransferTransactionStatus)
