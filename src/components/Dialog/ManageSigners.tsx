import React from "react"
import { Operation, Server, Transaction } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog"
import Slide, { SlideProps } from "@material-ui/core/Slide"
import Typography from "@material-ui/core/Typography"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import { Account } from "../../context/accounts"
import { addError } from "../../context/notifications"
import { AccountObservable } from "../../lib/subscriptions"
import { createTransaction } from "../../lib/transaction"
import { Box, HorizontalLayout } from "../Layout/Box"
import ManageSignersForm, { SignerUpdate } from "../ManageSigners/ManageSignersForm"
import { AccountData } from "../Subscribers"
import TransactionSender from "../TransactionSender"
import ButtonIconLabel from "../ButtonIconLabel"
import SignersEditor from "../ManageSigners/SignersEditor"
import BackButton from "./BackButton"

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>

const Transition = (props: SlideProps) => <Slide {...props} direction="left" />

interface Props {
  account: Account
  accountData: AccountObservable
  horizon: Server
  open: boolean
  onClose: () => void
  sendTransaction: (tx: Transaction) => void
}

interface State {
  transaction: Transaction | null
  txCreationPending: boolean
}

class ManageSignersDialog extends React.Component<Props, State> {
  editor = React.createRef<SignersEditor>()

  state: State = {
    transaction: null,
    txCreationPending: false
  }

  addCosigner = () => {
    if (this.editor.current) {
      this.editor.current.addAdditionalCosigner()
    }
  }

  createTransaction = async (update: SignerUpdate) => {
    try {
      this.setState({ txCreationPending: true })

      const operations = [
        ...update.signersToAdd.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: signer.public_key, weight: signer.weight }
          })
        ),
        ...update.signersToRemove.map(signer =>
          Operation.setOptions({
            signer: { ed25519PublicKey: signer.public_key, weight: 0 }
          })
        ),
        Operation.setOptions({
          lowThreshold: update.weightThreshold,
          medThreshold: update.weightThreshold,
          highThreshold: update.weightThreshold
        })
      ]

      const tx = await createTransaction(operations, {
        horizon: this.props.horizon,
        walletAccount: this.props.account
      })

      const submissionPromise = this.props.sendTransaction(tx)
      this.setState({ txCreationPending: false })

      await submissionPromise
    } catch (error) {
      addError(error)
      this.setState({ txCreationPending: false })
    }
  }

  render() {
    return (
      <Dialog open={this.props.open} fullScreen onClose={this.props.onClose} TransitionComponent={Transition}>
        <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
          <HorizontalLayout alignItems="center" margin="0 0 24px">
            <BackButton onClick={this.props.onClose} />
            <Typography variant="headline" style={{ flexGrow: 1 }}>
              Manage Account Signers
            </Typography>
            <Button color="primary" onClick={this.addCosigner} style={{ marginLeft: 32 }} variant="contained">
              <ButtonIconLabel label="Add Co-Signer">
                <PersonAddIcon />
              </ButtonIconLabel>
            </Button>
          </HorizontalLayout>
          <ManageSignersForm
            accountData={this.props.accountData}
            editorRef={this.editor}
            onCancel={this.props.onClose}
            onSubmit={this.createTransaction}
          />
        </Box>
      </Dialog>
    )
  }
}

const ManageSignersDialogContainer = (props: Omit<Props, "horizon" | "sendTransaction">) => {
  return (
    <TransactionSender account={props.account}>
      {({ horizon, sendTransaction }) => (
        <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
          {accountData => (
            <ManageSignersDialog
              {...props}
              accountData={accountData}
              horizon={horizon}
              sendTransaction={sendTransaction}
            />
          )}
        </AccountData>
      )}
    </TransactionSender>
  )
}

export default ManageSignersDialogContainer
