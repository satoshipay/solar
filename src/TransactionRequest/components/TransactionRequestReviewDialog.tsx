import Box from "@material-ui/core/Box"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Typography from "@material-ui/core/Typography"
import CancelIcon from "@material-ui/icons/Cancel"
import SelectIcon from "@material-ui/icons/Check"
import WarningIcon from "@material-ui/icons/Warning"
import { TransactionStellarUri } from "@stellarguard/stellar-uri"
import BigNumber from "big.js"
import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Server } from "stellar-sdk"
import AccountSelectionList from "~Account/components/AccountSelectionList"
import { Account, AccountsContext } from "~App/contexts/accounts"
import { breakpoints, warningColor } from "~App/theme"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import MainTitle from "~Generic/components/MainTitle"
import TestnetBadge from "~Generic/components/TestnetBadge"
import DialogBody from "~Layout/components/DialogBody"
import { useTransactionTitle } from "~TransactionReview/components/TransactionReviewDialog"
import TransactionSummary from "~TransactionReview/components/TransactionSummary"
import TransactionSender, { SendTransaction } from "../../Transaction/components/TransactionSender"

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 0 0"
  },
  uriContainer: {
    paddingTop: 32,
    paddingBottom: 32
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

interface TransactionRequestReviewDialogProps {
  accounts: Account[]
  horizon: Server
  onClose: () => void
  onAccountChange: (account: Account) => void
  selectedAccount: Account | null
  sendTransaction: SendTransaction
  txStellarUri: TransactionStellarUri
}

function TransactionRequestReviewDialog(props: TransactionRequestReviewDialogProps) {
  const { accounts, horizon, onClose, onAccountChange, selectedAccount, sendTransaction } = props
  const { msg, originDomain, pubkey, signature, isTestNetwork: testnet } = props.txStellarUri
  const transaction = React.useMemo(() => props.txStellarUri.getTransaction(), [props.txStellarUri])
  const replacements = React.useMemo(() => props.txStellarUri.getReplacements(), [props.txStellarUri])
  const sourceAccountReplacement = React.useMemo(
    () => replacements.find(replacement => replacement.path === "sourceAccount"),
    [replacements]
  )

  const classes = useStyles()
  const { t } = useTranslation()
  const getTitle = useTransactionTitle()

  const selectableAccounts = React.useMemo(() => {
    if (pubkey) {
      // pubkey parameter specifies public key of the account that should sign
      const requiredAccount = accounts.find(acc => acc.publicKey === pubkey)
      return requiredAccount ? [requiredAccount] : []
    } else {
      return accounts
    }
  }, [accounts, pubkey])

  const getNewSeqNumber = React.useCallback(
    async account => {
      const fetchedSeqNum = await horizon.loadAccount(account).then(acc => acc.sequence)
      const newSeqNum = BigNumber(fetchedSeqNum)
        .add(1)
        .toString()
      return newSeqNum
    },
    [horizon]
  )

  const onSelect = React.useCallback(async () => {
    const filledReplacements: { [key: string]: any } = {}
    const seqNumReplacement = replacements.find(replacement => replacement.id === "seqNum")
    if (seqNumReplacement) {
      const sourceAccount = sourceAccountReplacement && selectedAccount ? selectedAccount.publicKey : transaction.source
      const newSeqNum = await getNewSeqNumber(sourceAccount)
      filledReplacements[seqNumReplacement.id] = newSeqNum
    }
    if (sourceAccountReplacement && selectedAccount) {
      const sourceAccount = sourceAccountReplacement && selectedAccount ? selectedAccount.publicKey : transaction.source
      filledReplacements[sourceAccountReplacement.id] = selectedAccount.publicKey

      if (!seqNumReplacement) {
        // artificially add seqNum replacement to facilitate replacing seq number for new source account
        const artificialSeqNumReplacement = { id: "SEQ", path: "seqNum", hint: "sequence number" }
        props.txStellarUri.addReplacement(artificialSeqNumReplacement)
        const newSeqNum = await getNewSeqNumber(sourceAccount)
        filledReplacements[artificialSeqNumReplacement.id] = newSeqNum
      }
    }

    const newTx = props.txStellarUri.replace(filledReplacements).getTransaction()
    sendTransaction(newTx)
  }, [
    getNewSeqNumber,
    replacements,
    props.txStellarUri,
    sourceAccountReplacement,
    sendTransaction,
    selectedAccount,
    transaction.source
  ])

  return (
    <DialogBody
      preventNotchSpacing
      top={
        <MainTitle
          hideBackButton
          onBack={onClose}
          title={
            <span>
              {t("transaction-request.transaction.title")}
              {testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
            </span>
          }
        />
      }
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<CancelIcon />} onClick={onClose} type="secondary">
            {t("transaction-request.transaction.action.dismiss")}
          </ActionButton>
          <ActionButton disabled={!selectedAccount} icon={<SelectIcon />} onClick={onSelect} type="primary">
            {t("transaction-request.transaction.action.select")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box className={classes.root}>
        {signature ? (
          <Typography>
            <Trans i18nKey="transaction-request.payment.header.origin-domain">
              The following transaction has been proposed by <b>{{ originDomain }}</b>.
            </Trans>
          </Typography>
        ) : (
          <Box className={classes.warningContainer}>
            <WarningIcon />
            <Typography style={{ padding: 8 }}>{t("transaction-request.payment.warning")}</Typography>
            <WarningIcon />
          </Box>
        )}
        {msg && (
          <Typography>
            <b>Message:</b>
            {msg}
          </Typography>
        )}
        <Typography className={classes.uriContainer} variant="h6">
          <Typography variant="h6">{getTitle(transaction)}</Typography>
          <TransactionSummary
            account={null}
            fullWidth
            showSource={!sourceAccountReplacement}
            canSubmit={false}
            transaction={transaction}
            testnet={testnet}
          />
        </Typography>
        {sourceAccountReplacement ? (
          selectableAccounts.length > 0 ? (
            <>
              <Typography variant="h6">
                {t("transaction-request.transaction.account-selector.source-account")} <br />
              </Typography>
              {sourceAccountReplacement.hint && (
                <Typography variant="body1">
                  <b>{t("transaction-request.transaction.hint")}:</b> {sourceAccountReplacement.hint}
                </Typography>
              )}
              <AccountSelectionList accounts={selectableAccounts} onChange={onAccountChange} testnet={testnet} />
            </>
          ) : pubkey ? (
            <Typography align="center" color="error" variant="h6" style={{ paddingTop: 16 }}>
              {t("transaction-request.transaction.error.signer-not-imported", { signer: pubkey })}
            </Typography>
          ) : (
            <Typography align="center" color="error" variant="h6" style={{ paddingTop: 16 }}>
              {t("transaction-request.transaction.error.no-eligible-account")}
            </Typography>
          )
        ) : (
          <>
            <Typography variant="h6">
              {t("transaction-request.transaction.account-selector.signing-account")} <br />
            </Typography>
            <AccountSelectionList accounts={selectableAccounts} onChange={onAccountChange} testnet={testnet} />
          </>
        )}
      </Box>
    </DialogBody>
  )
}

function NoAccountsDialog(props: { onClose: () => void; testnet: boolean }) {
  const { t } = useTranslation()
  return (
    <DialogBody
      preventNotchSpacing
      top={
        <MainTitle
          hideBackButton
          onBack={props.onClose}
          title={
            <span>
              {t("transaction-request.payment-account-selection.title")}
              {props.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
            </span>
          }
        />
      }
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<CancelIcon />} onClick={props.onClose} type="secondary">
            {t("transaction-request.payment-account-selection.action.dismiss")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box>
        <Typography>No accounts found for network.</Typography>
        <Typography>You must import an account before you can sign transaction requests.</Typography>
      </Box>
    </DialogBody>
  )
}

interface ConnectedTransactionRequestReviewDialogProps {
  onClose: () => void
  txStellarUri: TransactionStellarUri
}

function ConnectedTransferRequestReviewDialog(props: ConnectedTransactionRequestReviewDialogProps) {
  const { accounts } = React.useContext(AccountsContext)
  const testnet = props.txStellarUri.isTestNetwork
  const selectableAccounts = React.useMemo(() => accounts.filter(acc => acc.testnet === testnet), [accounts, testnet])
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)

  return selectableAccounts.length > 0 ? (
    <TransactionSender account={selectedAccount || selectableAccounts[0]} onSubmissionCompleted={props.onClose}>
      {({ horizon, sendTransaction }) => (
        <TransactionRequestReviewDialog
          {...props}
          accounts={selectableAccounts}
          horizon={horizon}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          sendTransaction={sendTransaction}
        />
      )}
    </TransactionSender>
  ) : (
    <NoAccountsDialog onClose={props.onClose} testnet={testnet} />
  )
}

export default React.memo(ConnectedTransferRequestReviewDialog)
