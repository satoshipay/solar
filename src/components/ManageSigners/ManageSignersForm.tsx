import React from "react"
import { useState } from "react"
import { AccountRecord } from "stellar-sdk"
import Button from "@material-ui/core/Button"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Tooltip from "@material-ui/core/Tooltip"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import InfoIcon from "@material-ui/icons/Info"
import { renderFormFieldError } from "../../lib/errors"
import { ObservedAccountData } from "../../lib/subscriptions"
import { trackError } from "../../context/notifications"
import ButtonIconLabel from "../ButtonIconLabel"
import { Box, HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { HorizontalMargin } from "../Layout/Spacing"
import SignersEditor from "./SignersEditor"

const max = (numbers: number[]) => numbers.reduce((prevMax, no) => (no > prevMax ? no : prevMax), 0)
const sum = (numbers: number[]) => numbers.reduce((total, no) => total + no, 0)

export type Signer = AccountRecord["signers"][0]

export interface SignerUpdate {
  signersToAdd: Signer[]
  signersToRemove: Signer[]
  weightThreshold: number
}

function getEffectiveWeightThreshold(accountData: ObservedAccountData) {
  const weightThresholdOnLedger = max([
    accountData.thresholds.low_threshold,
    accountData.thresholds.med_threshold,
    accountData.thresholds.high_threshold
  ])

  // Turn 0 values (which is the default) to 1, since the network will require
  // every tx to have at least one signature
  return weightThresholdOnLedger || 1
}

function getUpdatedSigners(accountData: ObservedAccountData, signersToAdd: Signer[], signersToRemove: Signer[]) {
  const signersPubKeysToAdd = signersToAdd.map(signer => signer.public_key)
  const signersPubKeysToRemove = signersToRemove.map(signer => signer.public_key)

  const isNotToBeAdded = (signer: Signer) => signersPubKeysToAdd.indexOf(signer.public_key) === -1
  const isNotToBeRemoved = (signer: Signer) => signersPubKeysToRemove.indexOf(signer.public_key) === -1

  const updatedSigners = [...accountData.signers.filter(isNotToBeAdded).filter(isNotToBeRemoved), ...signersToAdd]

  return [
    ...updatedSigners.filter(signer => signer.public_key === accountData.id),
    ...updatedSigners.filter(signer => signer.public_key !== accountData.id)
  ]
}

function validateFormValues(weightThreshold: string, updatedSigners: Signer[]): Error | undefined {
  if (updatedSigners.length === 0) {
    throw new Error("No signers left. Don't lock yourself out!")
  }
  if (!weightThreshold.match(/^[0-9]+$/)) {
    return new Error("Weight must be an integer.")
  }

  const allKeysCombinedWeight = sum(updatedSigners.map(signer => signer.weight))
  const weightThresholdInteger = Number.parseInt(weightThreshold, 10)

  if (weightThresholdInteger > allKeysCombinedWeight) {
    return new Error("Threshold higher than combined key weights.")
  }
  if (updatedSigners.length > 1 && weightThresholdInteger === 0) {
    return new Error("Please set a threshold.")
  }
}

function KeyWeightThresholdInfoAdornment(props: { text: string }) {
  return (
    <InputAdornment position="end" style={{ color: "rgba(0, 0, 0, 0.54)", cursor: "default" }}>
      <Tooltip placement="right" title={props.text}>
        <InfoIcon />
      </Tooltip>
    </InputAdornment>
  )
}

interface Props {
  accountData: ObservedAccountData
  isEditingNewSigner: boolean
  setIsEditingNewSigner: (isEditingNewSigner: boolean) => void
  onCancel: () => void
  onSubmit: (values: SignerUpdate) => void
}

function ManageSignersForm(props: Props) {
  const { accountData } = props

  const [signersToAdd, setSignersToAdd] = useState<Signer[]>([])
  const [signersToRemove, setSignersToRemove] = useState<Signer[]>([])
  const [weightThresholdError, setWeightThresholdError] = useState<Error | undefined>(undefined)
  const [weightThreshold, setWeightThreshold] = useState(getEffectiveWeightThreshold(accountData).toString())

  const updatedSigners = getUpdatedSigners(accountData, signersToAdd, signersToRemove)
  const allDefaultKeyweights = updatedSigners.every(signer => signer.weight === 1)

  const addSigner = (signer: Signer) => setSignersToAdd([...signersToAdd, signer])

  const removeSigner = (signer: Signer) => {
    setSignersToAdd(signersToAdd.filter(someSignerToBeAddd => someSignerToBeAddd.public_key !== signer.public_key))
    setSignersToRemove([...signersToRemove, signer])
  }

  const submit = async () => {
    try {
      const validationError = validateFormValues(weightThreshold, updatedSigners)

      if (validationError) {
        return setWeightThresholdError(validationError)
      }

      setWeightThresholdError(undefined)

      await props.onSubmit({
        signersToAdd,
        signersToRemove,
        weightThreshold: Number.parseInt(weightThreshold, 10)
      })

      setSignersToAdd([])
      setSignersToRemove([])
    } catch (error) {
      trackError(error)
    }
  }

  const weightThresholdUnchanged =
    parseInt(weightThreshold, 10) === accountData.thresholds.high_threshold ||
    parseInt(weightThreshold, 10) === getEffectiveWeightThreshold(accountData)

  const nothingEdited = weightThresholdUnchanged && signersToAdd.length === 0 && signersToRemove.length === 0

  const weightThresholdLabel = allDefaultKeyweights ? "Required signatures" : "Required key weight"

  const sanitizedKeyWeight = weightThreshold.match(/^[0-9]+$/) ? String(weightThreshold) : "X"
  const weightThresholdExplanation = allDefaultKeyweights
    ? `Every transaction needs to be signed by ${sanitizedKeyWeight} signers`
    : `Every transaction needs to be signed by signers with a combined key weight of ${sanitizedKeyWeight} `

  return (
    <VerticalLayout minHeight="400px" justifyContent="space-between">
      <Box margin="20px 0 0">
        <SignersEditor
          isEditingNewSigner={props.isEditingNewSigner}
          setIsEditingNewSigner={props.setIsEditingNewSigner}
          addSigner={addSigner}
          removeSigner={removeSigner}
          localPublicKey={accountData.id}
          signers={updatedSigners}
          showKeyWeights={!allDefaultKeyweights}
        />
      </Box>
      <HorizontalLayout justifyContent="space-between" alignItems="center" margin="48px 0 0">
        <TextField
          error={!!weightThresholdError}
          label={weightThresholdError ? renderFormFieldError(weightThresholdError) : weightThresholdLabel}
          onChange={event => setWeightThreshold(event.target.value)}
          value={weightThreshold}
          variant="outlined"
          InputProps={{
            endAdornment: <KeyWeightThresholdInfoAdornment text={weightThresholdExplanation} />
          }}
        />
        <HorizontalLayout justifyContent="end" alignItems="center" width="auto">
          <Button variant="contained" onClick={props.onCancel}>
            <ButtonIconLabel label="Cancel">
              <CloseIcon />
            </ButtonIconLabel>
          </Button>
          <HorizontalMargin size={16} />
          <Button color="primary" disabled={nothingEdited} variant="contained" onClick={submit} type="submit">
            <ButtonIconLabel label={"Apply changes"}>
              <CheckIcon />
            </ButtonIconLabel>
          </Button>
        </HorizontalLayout>
      </HorizontalLayout>
    </VerticalLayout>
  )
}

export default ManageSignersForm
