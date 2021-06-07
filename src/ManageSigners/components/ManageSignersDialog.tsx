import React from "react"
import { Horizon } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import * as routes from "~App/routes"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useDialogActions, useRouter } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { CustomError } from "~Generic/lib/errors"
import { matchesRoute } from "~Generic/lib/routes"
import Carousel from "~Layout/components/Carousel"
import DialogBody from "~Layout/components/DialogBody"
import { MultisigPreset, MultisigPresets } from "~ManageSigners/lib/editor"
import TransactionSender from "~Transaction/components/TransactionSender"
import DetailsEditor from "./DetailsEditor"
import { MultisigEditorContext, MultisigEditorProvider, Step } from "./MultisigEditorContext"
import PresetSelector from "./PresetSelector"

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
    ...updatedSigners.filter(signer => signer.key !== accountData.id).reverse(),
    ...updatedSigners.filter(signer => signer.key === accountData.id)
  ]
}

function getWeightThreshold(preset: MultisigPreset, signers: Horizon.AccountSigner[]): number {
  if (preset.type === MultisigPresets.Type.SingleSignature) {
    return 0
  } else if (preset.type === MultisigPresets.Type.OneOutOfN) {
    return Math.min(...signers.map(signer => signer.weight))
  } else if (preset.type === MultisigPresets.Type.MOutOfN) {
    return preset.requiredKeyWeight
  } else {
    return preset.thresholds.high_threshold
  }
}

function validate(updatedSigners: Horizon.AccountSigner[], weightThreshold: number) {
  const totalKeyWeight = updatedSigners.reduce((total, signer) => total + signer.weight, 0)

  if (weightThreshold < 0 || (weightThreshold < 1 && updatedSigners.length > 1)) {
    throw CustomError("MultiSigConfigThresholdTooLowError", `Signature threshold too low.`)
  } else if (weightThreshold > totalKeyWeight) {
    throw CustomError("MultiSigConfigThresholdLockError", `Signature threshold too high. You would lock your account.`)
  }
}

interface Props {
  account: Account
  onCancel: () => void
}

function ManageSignersDialogContent(props: Props) {
  const { accountID, applyUpdate, currentStep, editorState, setEditorState, switchToStep, testnet } = React.useContext(
    MultisigEditorContext
  )
  const accountData = useLiveAccountData(accountID, testnet)
  const dialogActionsRef = useDialogActions()
  const router = useRouter()

  // store value of initial editorState to detect if changes were made
  const baseStateRef = React.useRef(editorState)

  const updatedSigners = getUpdatedSigners(accountData, editorState.signersToAdd, editorState.signersToRemove)
  const allDefaultKeyweights = updatedSigners.every(signer => signer.weight === 1)

  const proceedToSigners = React.useCallback(() => {
    router.history.push(routes.manageAccountSignersDetails(props.account.id))
    switchToStep(Step.Signers)
  }, [props.account.id, router.history, switchToStep])

  const switchBackToPresets = React.useCallback(() => {
    // reset editor state
    setEditorState(prev => ({ ...prev, signersToRemove: [], signersToAdd: [] }))
    switchToStep(Step.Presets)
  }, [switchToStep, setEditorState])

  React.useEffect(() => {
    if (matchesRoute(router.location.pathname, routes.manageAccountSigners(props.account.id), true)) {
      switchBackToPresets()
    }
  }, [router.location.pathname, props.account.id, switchBackToPresets])

  const submit = async () => {
    try {
      const weightThreshold = getWeightThreshold(editorState.preset, updatedSigners)

      validate(updatedSigners, weightThreshold)

      await applyUpdate({
        signersToAdd: editorState.signersToAdd,
        signersToRemove: editorState.signersToRemove,
        weightThreshold
      })

      baseStateRef.current = editorState

      setEditorState(prev => ({
        ...prev,
        signersToAdd: [],
        signersToRemove: []
      }))
    } catch (error) {
      trackError(error)
    }
  }

  // disable submit if no changes were made
  const disabled = React.useMemo(() => {
    const baseState = baseStateRef.current
    const samePreset =
      editorState.preset.type === "Custom" && baseState.preset.type === "Custom"
        ? editorState.preset.thresholds.high_threshold === baseState.preset.thresholds.high_threshold &&
          editorState.preset.thresholds.med_threshold === baseState.preset.thresholds.med_threshold &&
          editorState.preset.thresholds.low_threshold === baseState.preset.thresholds.low_threshold
        : editorState.preset.type === "MOutOfN" && baseState.preset.type === "MOutOfN"
        ? editorState.preset.requiredKeyWeight === baseState.preset.requiredKeyWeight
        : editorState.preset.type === baseState.preset.type

    if (
      (editorState.preset.type === "Custom" || editorState.preset.type === "MOutOfN") &&
      accountData.signers.length + editorState.signersToAdd.length < 2
    ) {
      return true
    }

    return editorState.signersToAdd.length === 0 && editorState.signersToRemove.length === 0 && samePreset
  }, [accountData, editorState])

  return (
    <DialogBody actions={dialogActionsRef}>
      <Carousel current={currentStep === Step.Signers ? 1 : 0}>
        <PresetSelector
          actionsRef={currentStep === Step.Presets ? dialogActionsRef : undefined}
          onProceed={proceedToSigners}
          style={{ marginBottom: 24 }}
        />
        <DetailsEditor
          actionsRef={currentStep === Step.Signers ? dialogActionsRef : undefined}
          disabled={disabled}
          onSubmit={submit}
          signers={updatedSigners}
          showKeyWeights={!allDefaultKeyweights}
          testnet={testnet}
        />
      </Carousel>
    </DialogBody>
  )
}

interface ManageSignersDialogProps {
  account: Account
  onClose: () => void
}

function ManageSignersDialog(props: ManageSignersDialogProps) {
  return (
    <TransactionSender account={props.account}>
      {({ sendTransaction }) => (
        <MultisigEditorProvider account={props.account} sendTransaction={sendTransaction}>
          <ManageSignersDialogContent account={props.account} onCancel={props.onClose} />
        </MultisigEditorProvider>
      )}
    </TransactionSender>
  )
}

export default React.memo(ManageSignersDialog)
