import BigNumber from "big.js"
import React from "react"
import { Trans, useTranslation } from "react-i18next"
import { Operation, Server, Transaction } from "stellar-sdk"
import TransactionSender, { SendTransaction } from "./TransactionSender"
import Box from "@material-ui/core/Box"
import makeStyles from "@material-ui/core/styles/makeStyles"
import Typography from "@material-ui/core/Typography"
import CancelIcon from "@material-ui/icons/Cancel"
import SelectIcon from "@material-ui/icons/Check"
import WarningIcon from "@material-ui/icons/Warning"
import { TransactionStellarUri } from "@stellarguard/stellar-uri"
import AccountSelectionList from "~Account/components/AccountSelectionList"
import { Account, AccountsContext } from "~App/contexts/accounts"
import { breakpoints, warningColor } from "~App/theme"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import MainTitle from "~Generic/components/MainTitle"
import TestnetBadge from "~Generic/components/TestnetBadge"
import { useLiveAccountDataSet } from "~Generic/hooks/stellar-subscriptions"
import { AccountData } from "~Generic/lib/account"
import DialogBody from "~Layout/components/DialogBody"
import { useTransactionTitle } from "~TransactionReview/components/TransactionReviewDialog"
import TransactionSummary from "~TransactionReview/components/TransactionSummary"

function getSelectableAccounts(transaction: Transaction, accounts: Account[], accountsData: AccountData[]) {
  return accounts.filter(acc => {
    const accountData = accountsData.find(data => data.account_id === acc.publicKey)
    if (!accountData) return false

    const paymentOperations = transaction.operations.filter(
      operations => operations.type === "payment"
    ) as Operation.Payment[]
    if (paymentOperations.length > 0) {
      const allOperationsViable = paymentOperations.every(operation => {
        // check if account holds trustline for every asset used in payment operations
        const asset = operation.asset
        if (asset.isNative()) {
          return true
        } else {
          return accountData.balances.some(
            (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
          )
        }
      })
      if (!allOperationsViable) return false
    }

    const changeTrustOperations = transaction.operations.filter(
      operation => operation.type === "changeTrust"
    ) as Operation.ChangeTrust[]
    if (changeTrustOperations.length > 0) {
      const allOperationsViable = changeTrustOperations.every(operation => {
        const asset = operation.line
        if (BigNumber(operation.limit).eq(0)) {
          // remove-trust operation
          if (
            !accountData.balances.some(
              (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
            )
          ) {
            return false
          }
        } else {
          // add-trust operation
          if (
            accountData.balances.some(
              (balance: any) => balance.asset_code === asset.code && balance.asset_issuer === asset.issuer
            )
          ) {
            return false
          }
        }
        return true
      })

      if (!allOperationsViable) return false
    }

    return true
  })
}

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
  accountsData: AccountData[]
  horizon: Server
  onClose: () => void
  onAccountChange: (account: Account) => void
  selectedAccount: Account | null
  sendTransaction: SendTransaction
  txStellarUri: TransactionStellarUri
}

function TransactionRequestReviewDialog(props: TransactionRequestReviewDialogProps) {
  const { accounts, accountsData, horizon, onClose, onAccountChange, selectedAccount, sendTransaction } = props
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
      return getSelectableAccounts(transaction, accounts, accountsData)
    }
  }, [accounts, accountsData, transaction, pubkey])

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
              {t("transaction-request.payment-account-selection.title")}
              {testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}
            </span>
          }
        />
      }
      actions={
        <DialogActionsBox desktopStyle={{ marginTop: 32 }} smallDialog>
          <ActionButton icon={<CancelIcon />} onClick={onClose} type="secondary">
            {t("transaction-request.payment-account-selection.action.dismiss")}
          </ActionButton>
          <ActionButton disabled={!selectedAccount} icon={<SelectIcon />} onClick={onSelect} type="primary">
            {t("transaction-request.payment-account-selection.action.select")}
          </ActionButton>
        </DialogActionsBox>
      }
    >
      <Box className={classes.root}>
        {signature ? (
          <Typography>
            <Trans i18nKey="transaction-request.payment-account-selection.header.origin-domain">
              The following transaction has been proposed by <b>{{ originDomain }}</b>.
            </Trans>
          </Typography>
        ) : (
          <Box className={classes.warningContainer}>
            <WarningIcon />
            <Typography style={{ padding: 8 }}>{t("transaction-request.payment-account-selection.warning")}</Typography>
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
                Select the source account <br />
              </Typography>
              {sourceAccountReplacement.hint && (
                <Typography variant="body1">
                  <b>Hint:</b> {sourceAccountReplacement.hint}
                </Typography>
              )}
              <AccountSelectionList accounts={selectableAccounts} onChange={onAccountChange} testnet={testnet} />
            </>
          ) : pubkey ? (
            <Typography align="center" color="error" variant="h6" style={{ paddingTop: 16 }}>
              The transaction request specified '{pubkey}' as the target signer but this account is not imported.
            </Typography>
          ) : (
            <Typography align="center" color="error" variant="h6" style={{ paddingTop: 16 }}>
              No eligible account found.
            </Typography>
          )
        ) : (
          <>
            <Typography variant="h6">
              Select the account that will sign the transaction <br />
            </Typography>
            <AccountSelectionList accounts={selectableAccounts} onChange={onAccountChange} testnet={testnet} />
          </>
        )}
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
  const accountsData = useLiveAccountDataSet(
    selectableAccounts.map(acc => acc.publicKey),
    testnet
  )
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)

  return (
    // FIXME fix default account of TransactionSender
    <TransactionSender account={selectedAccount || selectableAccounts[0]!} onSubmissionCompleted={props.onClose}>
      {({ horizon, sendTransaction }) => (
        <TransactionRequestReviewDialog
          {...props}
          accounts={accounts}
          accountsData={accountsData}
          horizon={horizon}
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          sendTransaction={sendTransaction}
        />
      )}
    </TransactionSender>
  )
}

export default React.memo(ConnectedTransferRequestReviewDialog)
