import React from "react"
import { AccountRecord } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import { renderFormFieldError } from "../../lib/errors"
import { AccountObservable } from "../../lib/subscriptions"
import ButtonIconLabel from "../ButtonIconLabel"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
import SignersEditor from "./SignersEditor"

const max = (numbers: number[]) => numbers.reduce((prevMax, no) => (no > prevMax ? no : prevMax), 0)
const sum = (numbers: number[]) => numbers.reduce((total, no) => total + no, 0)

interface ActionsProps {
  disabled?: boolean
  error?: Error
  onCancel: () => void
  onSubmit: () => Promise<any>
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
  accountData: AccountObservable
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

    const signersPubKeysToAdd = signersToAdd.map(signer => signer.public_key)
    const signersPubKeysToRemove = signersToRemove.map(signer => signer.public_key)

    const isNotToBeAdded = (signer: Signer) => signersPubKeysToAdd.indexOf(signer.public_key) === -1
    const isNotToBeRemoved = (signer: Signer) => signersPubKeysToRemove.indexOf(signer.public_key) === -1

    const updatedSigners = [
      ...this.props.accountData.signers.filter(isNotToBeAdded).filter(isNotToBeRemoved),
      ...signersToAdd
    ]

    return [
      ...updatedSigners.filter(signer => signer.public_key === this.props.accountData.id),
      ...updatedSigners.filter(signer => signer.public_key !== this.props.accountData.id)
    ]
  }

  addSigner = (signer: Signer) => {
    this.setState(state => ({
      ...state,
      signersToAdd: state.signersToAdd.concat([signer])
      // keep `signersToRemove` untouched
      // use case: remove signer, then re-add with different weight
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

  submit = async () => {
    const { signersToAdd, signersToRemove, weightThreshold } = this.state
    const updatedSigners = this.getUpdatedSigners()

    if (!weightThreshold.match(/^[0-9]+$/)) {
      return this.setState({
        weightThresholdError: new Error("Weight must be an integer.")
      })
    }

    const allKeysCombinedWeight = sum(updatedSigners.map(signer => signer.weight))
    const weightThresholdInteger = parseInt(weightThreshold, 10)

    if (weightThresholdInteger > allKeysCombinedWeight) {
      return this.setState({
        weightThresholdError: new Error("Threshold higher than combined key weights.")
      })
    }
    if (updatedSigners.length > 1 && weightThresholdInteger === 0) {
      return this.setState({
        weightThresholdError: new Error("Please set a threshold.")
      })
    }

    this.setState({
      weightThresholdError: undefined
    })

    await this.props.onSubmit({
      signersToAdd,
      signersToRemove,
      weightThreshold: weightThresholdInteger
    })

    this.setState({
      signersToAdd: [],
      signersToRemove: []
    })
  }

  updateWeightThreshold = (weightThreshold: string) => {
    this.setState({ weightThreshold })
  }

  render() {
    const { accountData, onCancel } = this.props
    const { signersToAdd, signersToRemove, weightThreshold, weightThresholdError } = this.state

    const nothingEdited =
      parseInt(weightThreshold, 10) === accountData.thresholds.high_threshold &&
      signersToAdd.length === 0 &&
      signersToRemove.length === 0

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
          disabled={nothingEdited}
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

export default ManageSignersForm
