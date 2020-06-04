import React from "react"
import { useTranslation } from "react-i18next"
import { Horizon } from "stellar-sdk"
import { trackError } from "~App/contexts/notifications"
import MainTitle from "~Generic/components/MainTitle"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useDialogActions, useIsMobile } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { CustomError } from "~Generic/lib/errors"
import Carousel from "~Layout/components/Carousel"
import DialogBody from "~Layout/components/DialogBody"
import { MultisigPresets, MultisigPreset } from "~ManageSigners/lib/editor"
import { MultisigEditorContext, Step } from "./MultisigEditorContext"
import PresetSelector from "./PresetSelector"
import DetailsEditor from "./DetailsEditor"

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
    throw CustomError("MultisigConfigThresholdTooLowError", `Signature threshold too low.`)
  } else if (weightThreshold > totalKeyWeight) {
    throw CustomError("MultisigConfigThresholdLockError", `Signature threshold too high. You would lock your account.`)
  }
}

interface Props {
  onCancel: () => void
}

function ManageSignersDialogContent(props: Props) {
  const { accountID, applyUpdate, currentStep, editorState, setEditorState, switchToStep, testnet } = React.useContext(
    MultisigEditorContext
  )
  const { t } = useTranslation()
  const accountData = useLiveAccountData(accountID, testnet)
  const isSmallScreen = useIsMobile()
  const dialogActionsRef = useDialogActions()

  const updatedSigners = getUpdatedSigners(accountData, editorState.signersToAdd, editorState.signersToRemove)
  const allDefaultKeyweights = updatedSigners.every(signer => signer.weight === 1)

  const proceedToSigners = React.useCallback(() => switchToStep(Step.Signers), [switchToStep])
  const switchBackToPresets = React.useCallback(() => switchToStep(Step.Presets), [switchToStep])

  const submit = async () => {
    try {
      const updatedSigners: Horizon.AccountSigner[] = getUpdatedSigners(
        accountData,
        editorState.signersToAdd,
        editorState.signersToRemove
      )
      const weightThreshold = getWeightThreshold(editorState.preset, updatedSigners)

      validate(updatedSigners, weightThreshold)

      await applyUpdate({
        signersToAdd: editorState.signersToAdd,
        signersToRemove: editorState.signersToRemove,
        weightThreshold
      })

      setEditorState(prev => ({
        ...prev,
        signersToAdd: [],
        signersToRemove: []
      }))
    } catch (error) {
      trackError(error)
    }
  }

  const title = React.useMemo(
    () => (
      <MainTitle
        title={
          isSmallScreen
            ? t("account-settings.manage-signers.title.short")
            : t("account-settings.manage-signers.title.long")
        }
        onBack={currentStep === Step.Presets ? props.onCancel : switchBackToPresets}
        style={{ marginBottom: 24 }}
      />
    ),
    [currentStep, isSmallScreen, t, props.onCancel]
  )

  return (
    <DialogBody top={title} actions={dialogActionsRef}>
      <Carousel current={currentStep === Step.Signers ? 1 : 0}>
        <PresetSelector
          actionsRef={currentStep === Step.Presets ? dialogActionsRef : undefined}
          onProceed={proceedToSigners}
          style={{ marginBottom: 24 }}
        />
        <DetailsEditor
          actionsRef={currentStep === Step.Signers ? dialogActionsRef : undefined}
          onSubmit={submit}
          signers={updatedSigners}
          showKeyWeights={!allDefaultKeyweights}
        />
      </Carousel>
    </DialogBody>
  )
}

export default React.memo(ManageSignersDialogContent)
