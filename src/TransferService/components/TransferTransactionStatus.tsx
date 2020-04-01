import React from "react"
import { useTranslation } from "react-i18next"
import Typography from "@material-ui/core/Typography"
import { DepositTransaction, TransferStatus, WithdrawalTransaction } from "@satoshipay/stellar-transfer"
import { VerticalLayout } from "~Layout/components/Box"
import { formatDuration } from "../util/formatters"

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
  const { t } = useTranslation()
  return (
    <VerticalLayout grow>
      <VerticalLayout alignItems="center" margin="16px auto" textAlign="center">
        {(() => {
          if (!props.transaction || props.transaction.status === TransferStatus.incomplete) {
            return props.didRedirectAlready ? (
              <>
                <Paragraph>
                  {t(
                    "transfer-service.transaction-status.incomplete.already-redirected.info.1",
                    `${props.domain} is checking your personal information. Please try again later.`,
                    { domain: props.domain }
                  )}{" "}
                </Paragraph>
                {props.transaction && props.transaction.status_eta ? (
                  <Paragraph>
                    {t(
                      "transfer-service.transaction-status.incomplete.already-redirected.info.2",
                      `Estimated time to completion: ${formatDuration(props.transaction.status_eta)}`,
                      { eta: formatDuration(props.transaction.status_eta) }
                    )}
                  </Paragraph>
                ) : null}
              </>
            ) : (
              <Paragraph>
                {t(
                  "transfer-service.transaction-status.incomplete.not-redirected.info",
                  `${props.domain} requires you to provide additional information.`,
                  { domain: props.domain }
                )}
              </Paragraph>
            )
          } else if (props.transaction.status === TransferStatus.error) {
            return (
              <>
                <Paragraph>
                  $
                  {props.type === "deposit"
                    ? t("transfer-service.transaction-status.error.rejected.deposit")
                    : t("transfer-service.transaction-status.error.rejected.withdrawal")}{" "}
                  – {props.transaction.message}
                </Paragraph>
                <Paragraph>
                  {t("transfer-service.transaction-status.error.contact", `Please contact ${props.domain}.`, {
                    domain: props.domain
                  })}
                </Paragraph>
              </>
            )
          } else if (props.transaction.status === TransferStatus.pending_user_transfer_start) {
            return (
              <Paragraph>
                {t(
                  "transfer-service.transaction-status.pending-user-transfer-start.info",
                  `${props.domain} requires further information from you.`,
                  { domain: props.domain }
                )}
              </Paragraph>
            )
          } else if (props.transaction.more_info_url) {
            return (
              <Paragraph>
                {t("transfer-service.transaction-status.more-info-url.info")}
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
