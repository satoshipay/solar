import React from "react"
import { AccountRecord } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import { Account } from "../../context/accounts"
import { renderFormFieldError } from "../../lib/errors"
import ButtonIconLabel from "../ButtonIconLabel"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
import SignersEditor from "./SignersEditor"
import { AccountData } from "../Subscribers"

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
    <HorizontalLayout justifyContent="space-between" alignItems="center" margin="64px 0 0">
      <TextField
        error={!!props.error}
        label={props.error ? renderFormFieldError(props.error) : "Key weight threshold"}
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
    weightThreshold: "1"
  }

  getUpdatedSigners = () => {
    const { signersToAdd, signersToRemove } = this.state

    const signersPubKeysToRemove = signersToRemove.map(signer => signer.public_key)
    const isNotToBeRemoved = (signer: Signer) => signersPubKeysToRemove.indexOf(signer.public_key) === -1

    return [...this.props.accountData.signers, ...signersToAdd].filter(isNotToBeRemoved)
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
    const { account, onCancel } = this.props
    const { signersToAdd, signersToRemove, weightThreshold, weightThresholdError } = this.state

    return (
      <VerticalLayout minHeight="400px" justifyContent="space-between">
        <Typography variant="headline">{account.name} Signers</Typography>
        <SignersEditor addSigner={this.addSigner} removeSigner={this.removeSigner} signers={this.getUpdatedSigners()} />
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

const ManageSignersContainer = (props: Pick<Props, "account" | "onCancel" | "onSubmit">) => {
  return (
    <AccountData publicKey={props.account.publicKey} testnet={props.account.testnet}>
      {accountData => <ManageSignersForm {...props} accountData={accountData as any} />}
    </AccountData>
  )
}

export default ManageSignersContainer
