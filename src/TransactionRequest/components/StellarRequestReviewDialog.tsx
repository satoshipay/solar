import Box from "@material-ui/core/Box"
import { makeStyles } from "@material-ui/core/styles"
import Typography from "@material-ui/core/Typography"
import WarningIcon from "@material-ui/icons/Warning"
import { PayStellarUri, StellarUri, StellarUriType, TransactionStellarUri } from "@stellarguard/stellar-uri"
import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Account, AccountsContext } from "~App/contexts/accounts"
import { breakpoints, warningColor } from "~App/theme"
import MainTitle from "~Generic/components/MainTitle"
import { RefStateObject, useDialogActions } from "~Generic/hooks/userinterface"
import DialogBody from "~Layout/components/DialogBody"
import TransactionSender from "../../Transaction/components/TransactionSender"
import NoAccountsDialog from "./NoAccountsDialog"
import PaymentRequestContent from "./PaymentRequestContent"
import TransactionRequestContent from "./TransactionRequestContent"

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 0 0"
  },
  warningContainer: {
    alignItems: "center",
    alignSelf: "center",
    background: warningColor,
    display: "flex",
    justifyContent: "center",
    padding: "6px 16px",
    width: "fit-content",

    [breakpoints.up(600)]: {
      width: "100%"
    }
  }
}))

interface StellarRequestReviewDialogProps {
  children: React.ReactNode
  actionsRef: RefStateObject
  stellarUri: StellarUri
  onClose: () => void
}

function StellarRequestReviewDialog(props: StellarRequestReviewDialogProps) {
  const { onClose } = props

  const classes = useStyles()
  const { t } = useTranslation()

  return (
    <DialogBody
      preventNotchSpacing
      top={<MainTitle hideBackButton onBack={onClose} title={t("transaction-request.stellar-uri.title")} />}
      actions={props.actionsRef}
    >
      <Box className={classes.root}>
        {props.stellarUri.signature ? (
          <Typography>
            <Trans i18nKey="transaction-request.stellar-uri.header.origin-domain">
              The following transaction has been proposed by <b>{{ originDomain: props.stellarUri.originDomain }}</b>.
            </Trans>
          </Typography>
        ) : (
          <Box className={classes.warningContainer}>
            <WarningIcon />
            <Typography style={{ padding: 8 }}>{t("transaction-request.stellar-uri.header.warning")}</Typography>
            <WarningIcon />
          </Box>
        )}
        {props.children}
      </Box>
    </DialogBody>
  )
}

function ConnectedStellarRequestReviewDialog(props: Pick<StellarRequestReviewDialogProps, "stellarUri" | "onClose">) {
  const { accounts } = React.useContext(AccountsContext)
  const testnet = props.stellarUri.isTestNetwork
  const accountsForNetwork = React.useMemo(() => accounts.filter(acc => acc.testnet === testnet), [accounts, testnet])
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(
    accountsForNetwork.length > 0 ? accountsForNetwork[0] : null
  )

  const dialogActionsRef = useDialogActions()

  return accountsForNetwork.length > 0 ? (
    <TransactionSender account={selectedAccount || accountsForNetwork[0]} onSubmissionCompleted={props.onClose}>
      {({ horizon, sendTransaction }) => (
        <StellarRequestReviewDialog {...props} actionsRef={dialogActionsRef}>
          {props.stellarUri.operation === StellarUriType.Pay ? (
            <PaymentRequestContent
              accounts={accountsForNetwork}
              actionsRef={dialogActionsRef}
              horizon={horizon}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
              sendTransaction={sendTransaction}
              onClose={props.onClose}
              payStellarUri={props.stellarUri as PayStellarUri}
            />
          ) : (
            <TransactionRequestContent
              accounts={accountsForNetwork}
              actionsRef={dialogActionsRef}
              horizon={horizon}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
              sendTransaction={sendTransaction}
              onClose={props.onClose}
              txStellarUri={props.stellarUri as TransactionStellarUri}
            />
          )}
        </StellarRequestReviewDialog>
      )}
    </TransactionSender>
  ) : (
    <NoAccountsDialog onClose={props.onClose} testnet={testnet} />
  )
}

export default ConnectedStellarRequestReviewDialog
