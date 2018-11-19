import React from "react"
import { AccountRecord } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import { Account } from "../../context/accounts"
import { renderFormFieldError } from "../../lib/errors"
import ButtonIconLabel from "../ButtonIconLabel"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
import SignersEditor from "./SignersEditor"
import { AccountData } from "../Subscribers"

const max = (numbers: number[]) => numbers.reduce((prevMax, no) => (no > prevMax ? no : prevMax), 0)
const sum = (numbers: number[]) => numbers.reduce((total, no) => total + no, 0)

interface ActionsProps {
  disabled?: boolean
  error?: Error
  onCancel: () => void
  onSubmit: () => void
  onWeightThresholdUpdate: (threshold: string) => void
  weightThreshold: string
}

const Actions = (props: ActionsProps) => {
  return (
    <HorizontalLayout justifyContent="space-between" alignItems="center" margin="48px 0 0">
      <TextField
        error={!!props.error}
        label={props.error ? renderFormFieldError(props.error) : "Required key weight sum"}
        onChange={event => props.onWeightThresholdUpdate(event.target.value)}
        value={props.weightThreshold}
        variant="outlined"
      />
      <HorizontalLayout justifyContent="end" alignItems="center" width="auto">
        <Button variant="contained" onClick={props.onCancel}>
          <ButtonIconLabel label="Cancel">
            <CloseIcon />
          </ButtonIconLabel>
        </Button>
        <HorizontalMargin size={16} />
        <Button color="primary" disabled={props.disabled} variant="contained" onClick={props.onSubmit} type="submit">
          <ButtonIconLabel label={"Apply changes"}>
            <CheckIcon />
          </ButtonIconLabel>
        </Button>
      </HorizontalLayout>
    </HorizontalLayout>
  )
}

export type Signer = AccountRecord["signers"][0]

export interface SignerUpdate {
  signersToAdd: Signer[]
  signersToRemove: Signer[]
  weightThreshold: number
}

interface Props {
  account: Account
  accountData: AccountRecord
  editorRef?: React.Ref<SignersEditor>
  onCancel: () => void
  onSubmit: (values: SignerUpdate) => void
}

interface State {
  signersToAdd: Signer[]
  signersToRemove: Signer[]
  weightThreshold: string
  weightThresholdError?: Error
}

class ManageSignersForm extends React.Component<Props, State> {
  state: State = {
    signersToAdd: [],
    signersToRemove: [],
    weightThreshold: String(
      max([
        this.props.accountData.thresholds.low_threshold,
        this.props.accountData.thresholds.med_threshold,
        this.props.accountData.thresholds.high_threshold
      ])
    )
  }

  getUpdatedSigners = () => {
    const { signersToAdd, signersToRemove } = this.state

    const existingSigners = [
      ...this.props.accountData.signers.filter(signer => signer.public_key === this.props.account.publicKey),
      ...this.props.accountData.signers.filter(signer => signer.public_key !== this.props.account.publicKey)
    ]

    const signersPubKeysToRemove = signersToRemove.map(signer => signer.public_key)
    const isNotToBeRemoved = (signer: Signer) => signersPubKeysToRemove.indexOf(signer.public_key) === -1

    return [...existingSigners, ...signersToAdd].filter(isNotToBeRemoved)
  }

  addSigner = (signer: Signer) => {
    this.setState(state => ({
      ...state,
      signersToAdd: state.signersToAdd.concat([signer]),
      signersToRemove: state.signersToRemove.filter(
        someSignerToBeRemoved => someSignerToBeRemoved.public_key !== signer.public_key
      )
    }))
  }

  removeSigner = (signer: Signer) => {
    this.setState(state => ({
      ...state,
      signersToAdd: state.signersToAdd.filter(
        someSignerToBeAddd => someSignerToBeAddd.public_key !== signer.public_key
      ),
      signersToRemove: state.signersToRemove.concat([signer])
    }))
  }

  submit = () => {
    const { signersToAdd, signersToRemove, weightThreshold } = this.state

    if (!weightThreshold.match(/^[0-9]+$/)) {
      return this.setState({
        weightThresholdError: new Error("Weight must be an integer.")
      })
    }

    const allKeysCombinedWeight = sum(this.getUpdatedSigners().map(signer => signer.weight))
    const weightThresholdInteger = parseInt(weightThreshold, 10)

    if (weightThresholdInteger > allKeysCombinedWeight) {
      return this.setState({
        weightThresholdError: new Error("Threshold higher than combined key weights.")
      })
    }

    this.props.onSubmit({
      signersToAdd,
      signersToRemove,
      weightThreshold: weightThresholdInteger
    })
  }

  updateWeightThreshold = (weightThreshold: string) => {
    this.setState({ weightThreshold })
  }

  render() {
    const { onCancel } = this.props
    const { signersToAdd, signersToRemove, weightThreshold, weightThresholdError } = this.state

    return (
      <VerticalLayout minHeight="400px" justifyContent="space-between">
        <Box margin="20px 0 0">
          <SignersEditor
            addSigner={this.addSigner}
            ref={this.props.editorRef}
            removeSigner={this.removeSigner}
            signers={this.getUpdatedSigners()}
          />
        </Box>
        <Actions
          disabled={signersToAdd.length === 0 && signersToRemove.length === 0}
          error={weightThresholdError}
          onCancel={onCancel}
          onSubmit={this.submit}
          onWeightThresholdUpdate={this.updateWeightThreshold}
          weightThreshold={weightThreshold}
        />
      </VerticalLayout>
    )
  }
}

const ManageSignersContainer = (props: Pick<Props, "account" | "editorRef" | "onCancel" | "onSubmit">) => {
  return (
    <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
      {accountData => <ManageSignersForm {...props} accountData={accountData as any} />}
    </AccountData>
  )
}

export default ManageSignersContainer
