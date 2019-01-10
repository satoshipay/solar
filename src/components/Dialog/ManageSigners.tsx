import React from "react"
import { useState } from "react"
import { Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { ObservedAccountData } from "../../lib/subscriptions"
import { createTransaction } from "../../lib/transaction"
import { Box, HorizontalLayout } from "../Layout/Box"
import ManageSignersForm, { SignerUpdate } from "../ManageSigners/ManageSignersForm"
import TransactionSender from "../TransactionSender"
import ButtonIconLabel from "../ButtonIconLabel"
import BackButton from "./BackButton"
import { useAccountData } from "../../hooks"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

const Transition = (props: SlideProps) => <Slide {...props} direction="left" />

interface Props {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (tx: Transaction) => void
}

function ManageSignersDialog(props: Props) {
  const [isEditingNewSigner, setIsEditingNewSigner] = useState(false)
  const [, setTxCreationPending] = useState(false)

  const submitTransaction = async (update: SignerUpdate) => {
    try {
      setTxCreationPending(true)

      const operations = [
        // signer removals before adding, so you can remove and immediately re-add signer
        ...update.signersToRemove.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: signer.public_key, weight: 0 }
          })
        ),
        ...update.signersToAdd.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: signer.public_key, weight: signer.weight }
          })
        ),
        Operation.setOptions({
          lowThreshold: update.weightThreshold,
          medThreshold: update.weightThreshold,
          highThreshold: update.weightThreshold
        })
      ]

      const tx = await createTransaction(operations, {
        horizon: props.horizon,
        walletAccount: props.account
      })

      const submissionPromise = props.sendTransaction(tx)
      setTxCreationPending(false)

      await submissionPromise
    } catch (error) {
      trackError(error)
      setTxCreationPending(false)
    }
  }

  return (
    <Dialog open={props.open} fullScreen onClose={props.onClose} TransitionComponent={Transition}>
      <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
        <HorizontalLayout alignItems="center" margin="0 0 24px">
          <BackButton onClick={props.onClose} />
          <Typography variant="headline" style={{ flexGrow: 1 }}>
            Manage Account Signers
          </Typography>
          <Button
            color="primary"
            onClick={() => setIsEditingNewSigner(true)}
            style={{ marginLeft: 32 }}
            variant="contained"
          >
            <ButtonIconLabel label="Add Co-Signer">
              <PersonAddIcon />
            </ButtonIconLabel>
          </Button>
        </HorizontalLayout>
        <ManageSignersForm
          accountData={props.accountData}
          isEditingNewSigner={isEditingNewSigner}
          setIsEditingNewSigner={setIsEditingNewSigner}
          onCancel={props.onClose}
          onSubmit={submitTransaction}
        />
      </Box>
    </Dialog>
  )
}

function ManageSignersDialogContainer(props: Omit<Props, "accountData" | "horizon" | "sendTransaction">) {
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <ManageSignersDialog {...props} accountData={accountData} horizon={horizon} sendTransaction={sendTransaction} />
      )}
    </TransactionSender>
  )
}

export default ManageSignersDialogContainer
