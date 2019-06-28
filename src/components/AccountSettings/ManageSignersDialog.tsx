import React from "react"
import { Operation, Server, Transaction } from "stellar-sdk"
import useMediaQuery from "@material-ui/core/useMediaQuery"
import Button from "@material-ui/core/Button"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useAccountData, useIsMobile } from "../../hooks"
import { getSignerKey } from "../../lib/stellar"
import { createTransaction } from "../../lib/transaction"
import { ObservedAccountData } from "../../subscriptions"
import { Box } from "../Layout/Box"
import ManageSignersForm, { SignerUpdate } from "../ManageSigners/ManageSignersForm"
import TransactionSender from "../TransactionSender"
import ButtonIconLabel from "../ButtonIconLabel"
import ErrorBoundary from "../ErrorBoundary"
import MainTitle from "../MainTitle"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

interface Props {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  onClose: () => void
  sendTransaction: (account: Account, transaction: Transaction) => void
}

function ManageSignersDialog(props: Props) {
  const [isEditingNewSigner, setIsEditingNewSigner] = React.useState(false)
  const [, setTxCreationPending] = React.useState(false)

  const isSmallScreen = useIsMobile()
  const isWidthMax450 = useMediaQuery("(max-width:450px)")

  const submitTransaction = async (update: SignerUpdate) => {
    try {
      setTxCreationPending(true)

      const operations = [
        // signer removals before adding, so you can remove and immediately re-add signer
        ...update.signersToRemove.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: getSignerKey(signer), weight: 0 }
          })
        ),
        ...update.signersToAdd.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: getSignerKey(signer), weight: signer.weight }
          })
        )
      ]

      if (
        update.weightThreshold !== props.accountData.thresholds.low_threshold &&
        update.weightThreshold !== props.accountData.thresholds.med_threshold &&
        update.weightThreshold !== props.accountData.thresholds.high_threshold
      ) {
        operations.push(
          Operation.setOptions({
            lowThreshold: update.weightThreshold,
            medThreshold: update.weightThreshold,
            highThreshold: update.weightThreshold
          })
        )
      }

      const tx = await createTransaction(operations, {
        accountData: props.accountData,
        horizon: props.horizon,
        walletAccount: props.account
      })

      const submissionPromise = props.sendTransaction(props.account, tx)
      setTxCreationPending(false)

      await submissionPromise
    } catch (error) {
      trackError(error)
      setTxCreationPending(false)
    }
  }

  return (
    <ErrorBoundary>
      <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <MainTitle
          title={isSmallScreen ? "Manage Signers" : "Manage Account Signers"}
          actions={
            <>
              <Button color="primary" onClick={() => setIsEditingNewSigner(true)} variant="contained">
                <ButtonIconLabel label={isWidthMax450 ? "Signer" : "Add Co-Signer"}>
                  <PersonAddIcon />
                </ButtonIconLabel>
              </Button>
            </>
          }
          onBack={props.onClose}
          style={{ marginBottom: 24 }}
        />
        <ManageSignersForm
          accountData={props.accountData}
          isEditingNewSigner={isEditingNewSigner}
          setIsEditingNewSigner={setIsEditingNewSigner}
          onCancel={props.onClose}
          onSubmit={submitTransaction}
        />
      </Box>
    </ErrorBoundary>
  )
}

function ManageSignersDialogContainer(props: Omit<Props, "accountData" | "horizon" | "sendTransaction">) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  return (
    <TransactionSender testnet={props.account.testnet}>
      {({ horizon, sendTransaction }) => (
        <ManageSignersDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ManageSignersDialogContainer
