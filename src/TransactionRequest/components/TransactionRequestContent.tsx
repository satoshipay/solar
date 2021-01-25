import Box from "@material-ui/core/Box"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Typography from "@material-ui/core/Typography"
import CloseIcon from "@material-ui/icons/Close"
import SendIcon from "@material-ui/icons/Send"
import { TransactionStellarUri } from "@stellarguard/stellar-uri"
import BigNumber from "big.js"
import React from "react"
import { useTranslation } from "react-i18next"
import { Server } from "stellar-sdk"
import AccountSelectionList from "~Account/components/AccountSelectionList"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import Portal from "~Generic/components/Portal"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { useTransactionTitle } from "~TransactionReview/components/TransactionReviewDialog"
import TransactionSummary from "~TransactionReview/components/TransactionSummary"
import { SendTransaction } from "../../Transaction/components/TransactionSender"

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexDirection: "column",
    padding: "12px 0 0"
  },
  uriContainer: {
    paddingTop: 32,
    paddingBottom: 32
  }
}))

interface TransactionRequestContentProps {
  accounts: Account[]
  actionsRef: RefStateObject
  horizon: Server
  onClose: () => void
  onAccountChange: (account: Account) => void
  selectedAccount: Account | null
  sendTransaction: SendTransaction
  txStellarUri: TransactionStellarUri
}

function TransactionRequestContent(props: TransactionRequestContentProps) {
  const { onAccountChange, onClose, sendTransaction } = props
  const { msg, pubkey, isTestNetwork: testnet } = props.txStellarUri
  const transaction = React.useMemo(() => props.txStellarUri.getTransaction(), [props.txStellarUri])
  const replacements = React.useMemo(() => props.txStellarUri.getReplacements(), [props.txStellarUri])
  const sourceAccountReplacement = React.useMemo(
    () => replacements.find(replacement => replacement.path === "sourceAccount"),
    [replacements]
  )
  const [txCreationPending, setTxCreationPending] = React.useState(false)

  const classes = useStyles()
  const { t } = useTranslation()
  const getTitle = useTransactionTitle()

  const selectableAccounts = React.useMemo(() => {
    if (pubkey) {
      // pubkey parameter specifies public key of the account that should sign
      const requiredAccount = props.accounts.find(acc => acc.publicKey === pubkey)
      return requiredAccount ? [requiredAccount] : []
    } else {
      return props.accounts
    }
  }, [props.accounts, pubkey])

  const getNewSeqNumber = React.useCallback(
    async account => {
      const fetchedSeqNum = await props.horizon.loadAccount(account).then(acc => acc.sequence)
      const newSeqNum = BigNumber(fetchedSeqNum)
        .add(1)
        .toString()
      return newSeqNum
    },
    [props.horizon]
  )

  const onSelect = React.useCallback(async () => {
    try {
      setTxCreationPending(true)
      const filledReplacements: { [key: string]: any } = {}
      const seqNumReplacement = replacements.find(replacement => replacement.id === "seqNum")
      if (seqNumReplacement) {
        const sourceAccount =
          sourceAccountReplacement && props.selectedAccount ? props.selectedAccount.publicKey : transaction.source
        const newSeqNum = await getNewSeqNumber(sourceAccount)
        filledReplacements[seqNumReplacement.id] = newSeqNum
      }
      if (sourceAccountReplacement && props.selectedAccount) {
        const sourceAccount =
          sourceAccountReplacement && props.selectedAccount ? props.selectedAccount.publicKey : transaction.source
        filledReplacements[sourceAccountReplacement.id] = props.selectedAccount.publicKey

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
    } catch (error) {
      trackError(error)
    } finally {
      setTxCreationPending(false)
    }
  }, [
    getNewSeqNumber,
    props.txStellarUri,
    props.selectedAccount,
    replacements,
    sourceAccountReplacement,
    sendTransaction,
    transaction.source
  ])

  const dialogActions = React.useMemo(
    () => (
      <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
        <ActionButton icon={<CloseIcon style={{ fontSize: 16 }} />} onClick={onClose}>
          {t("transaction-request.transaction.action.dismiss")}
        </ActionButton>
        <ActionButton
          icon={<SendIcon style={{ fontSize: 16 }} />}
          disabled={!props.selectedAccount}
          loading={txCreationPending}
          onClick={onSelect}
          type="primary"
        >
          {t("transaction-request.transaction.action.select")}
        </ActionButton>
      </DialogActionsBox>
    ),
    [onSelect, onClose, props.selectedAccount, t, txCreationPending]
  )

  return (
    <Box>
      {msg && (
        <Typography>
          <b>{t("transaciton-request.transaction.uri-content.message")}:</b>
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
            <AccountSelectionList
              accounts={selectableAccounts}
              selectedAccount={props.selectedAccount || undefined}
              onChange={onAccountChange}
              testnet={testnet}
            />
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
      <Portal target={props.actionsRef.element}>{dialogActions}</Portal>
    </Box>
  )
}

export default TransactionRequestContent
