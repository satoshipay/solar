import React from "react"
import { Horizon } from "stellar-sdk"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import Tooltip from "@material-ui/core/Tooltip"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import InfoIcon from "@material-ui/icons/Info"
import { trackError } from "../../context/notifications"
import { useDialogActions, useIsMobile } from "../../hooks/userinterface"
import { AccountData } from "../../lib/account"
import { renderFormFieldError } from "../../lib/errors"
import DialogBody from "../Dialog/DialogBody"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import Portal from "../Portal"
import SignersEditor from "./SignersEditor"

const max = (numbers: number[]) => numbers.reduce((prevMax, no) => (no > prevMax ? no : prevMax), 0)
const sum = (numbers: number[]) => numbers.reduce((total, no) => total + no, 0)

export interface SignerUpdate {
  signersToAdd: Horizon.AccountSigner[]
  signersToRemove: Horizon.AccountSigner[]
  weightThreshold: number
}

function getEffectiveWeightThreshold(accountData: AccountData) {
  const weightThresholdOnLedger = max([
    accountData.thresholds.low_threshold,
    accountData.thresholds.med_threshold,
    accountData.thresholds.high_threshold
  ])

  // Turn 0 values (which is the default) to 1, since the network will require
  // every tx to have at least one signature
  return weightThresholdOnLedger || 1
}

function getUpdatedSigners(
  accountData: AccountData,
  signersToAdd: Horizon.AccountSigner[],
  signersToRemove: Horizon.AccountSigner[]
) {
  const signersPubKeysToAdd = signersToAdd.map(signer => signer.key)
  const signersPubKeysToRemove = signersToRemove.map(signer => signer.key)

  const isNotToBeAdded = (signer: Horizon.AccountSigner) => signersPubKeysToAdd.indexOf(signer.key) === -1
  const isNotToBeRemoved = (signer: Horizon.AccountSigner) => signersPubKeysToRemove.indexOf(signer.key) === -1

  const updatedSigners = [...accountData.signers.filter(isNotToBeAdded).filter(isNotToBeRemoved), ...signersToAdd]

  return [
    ...updatedSigners.filter(signer => signer.key === accountData.id),
    ...updatedSigners.filter(signer => signer.key !== accountData.id)
  ]
}

function validateFormValues(weightThreshold: string, updatedSigners: Horizon.AccountSigner[]): Error | undefined {
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
  accountData: AccountData
  isEditingNewSigner: boolean
  setIsEditingNewSigner: (isEditingNewSigner: boolean) => void
  onCancel: () => void
  onSubmit: (values: SignerUpdate) => void
  style?: React.CSSProperties
  title: React.ReactNode
}

function ManageSignersDialogContent(props: Props) {
  const { accountData } = props

  const actionsRef = useDialogActions()
  const isSmallScreen = useIsMobile()

  const [signersToAdd, setSignersToAdd] = React.useState<Horizon.AccountSigner[]>([])
  const [signersToRemove, setSignersToRemove] = React.useState<Horizon.AccountSigner[]>([])
  const [weightThresholdError, setWeightThresholdError] = React.useState<Error | undefined>(undefined)
  const [weightThreshold, setWeightThreshold] = React.useState(getEffectiveWeightThreshold(accountData).toString())

  const updatedSigners = getUpdatedSigners(accountData, signersToAdd, signersToRemove)
  const allDefaultKeyweights = updatedSigners.every(signer => signer.weight === 1)

  const addSigner = (signer: Horizon.AccountSigner) => setSignersToAdd([...signersToAdd, signer])

  const removeSigner = (signer: Horizon.AccountSigner) => {
    setSignersToAdd(signersToAdd.filter(someSignerToBeAddd => someSignerToBeAddd.key !== signer.key))
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

  const DialogActionsPortal = isSmallScreen
    ? (subprops: { children: React.ReactNode }) => <Portal target={actionsRef.element}>{subprops.children}</Portal>
    : (subprops: { children: React.ReactNode }) => <>{subprops.children}</>

  const actionsContent = (
    <HorizontalLayout justifyContent="space-between" alignItems="center" margin="48px 0 0" wrap="wrap">
      <TextField
        error={!!weightThresholdError}
        inputProps={{
          pattern: "[0-9]*",
          inputMode: "decimal"
        }}
        label={weightThresholdError ? renderFormFieldError(weightThresholdError) : weightThresholdLabel}
        onChange={event => setWeightThreshold(event.target.value)}
        type="number"
        value={weightThreshold}
        variant="outlined"
        InputProps={{
          endAdornment: <KeyWeightThresholdInfoAdornment text={weightThresholdExplanation} />
        }}
      />
      <HorizontalLayout
        alignItems="center"
        justifyContent={isSmallScreen ? "center" : "end"}
        margin="20px 0px"
        style={{ marginLeft: "auto" }}
        width={isSmallScreen ? "100%" : "auto"}
      >
        <DialogActionsPortal>
          <DialogActionsBox desktopStyle={{ margin: 0 }}>
            <ActionButton icon={<CloseIcon />} onClick={props.onCancel}>
              Cancel
            </ActionButton>
            <ActionButton disabled={nothingEdited} icon={<CheckIcon />} onClick={submit} type="submit">
              {isSmallScreen ? "Apply" : "Apply changes"}
            </ActionButton>
          </DialogActionsBox>
        </DialogActionsPortal>
      </HorizontalLayout>
    </HorizontalLayout>
  )

  return (
    <DialogBody top={props.title} actions={isSmallScreen ? actionsRef : undefined}>
      <VerticalLayout
        justifyContent="space-between"
        margin="8px 0 0"
        minHeight={isSmallScreen ? undefined : "40vh"}
        style={props.style}
      >
        <SignersEditor
          isEditingNewSigner={props.isEditingNewSigner}
          setIsEditingNewSigner={props.setIsEditingNewSigner}
          addSigner={addSigner}
          removeSigner={removeSigner}
          localPublicKey={accountData.id}
          signers={updatedSigners}
          showKeyWeights={!allDefaultKeyweights}
        />
      </VerticalLayout>
      {actionsContent}
    </DialogBody>
  )
}

export default React.memo(ManageSignersDialogContent)
