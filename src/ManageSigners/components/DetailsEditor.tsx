import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import React from "react"
import { useTranslation } from "react-i18next"
import { Horizon } from "stellar-sdk"
import { AccountsContext } from "~App/contexts/accounts"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import Portal from "~Generic/components/Portal"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useIsMobile, RefStateObject } from "~Generic/hooks/userinterface"
import { Box, VerticalLayout } from "~Layout/components/Box"
import { MultisigPreset, MultisigPresets } from "../lib/editor"
import { MultisigEditorContext } from "./MultisigEditorContext"
import SignersEditor from "./SignersEditor"
import SignerSelector from "./SignerSelector"

const PresetDescription = React.memo(function PresetDescription(props: { preset: MultisigPreset }) {
  const { t } = useTranslation()
  let description = ""
  let extraDescription = ""

  if (props.preset.type === MultisigPresets.Type.SingleSignature) {
    description = t("account-settings.manage-signers.preset-description.single-signature")
  } else if (props.preset.type === MultisigPresets.Type.OneOutOfN) {
    description = t("account-settings.manage-signers.preset-description.one-out-of-n")
  } else if (props.preset.type === MultisigPresets.Type.MOutOfN) {
    description = t("account-settings.manage-signers.preset-description.m-out-of-n", {
      count: props.preset.requiredKeyWeight || 0
    })
  }

  if (props.preset.type === MultisigPresets.Type.SingleSignature) {
    // Nothing to show
  } else if (props.preset.type === MultisigPresets.Type.OneOutOfN) {
    extraDescription = t("account-settings.manage-signers.preset-description-extra.one-out-of-n")
  } else if (props.preset.type === MultisigPresets.Type.MOutOfN) {
    extraDescription = t("account-settings.manage-signers.preset-description-extra.m-out-of-n")
  }

  return (
    <>
      <Typography align="center" color="textSecondary" gutterBottom>
        {description}
      </Typography>
      {extraDescription ? (
        <Typography align="center" color="textSecondary">
          {extraDescription}
        </Typography>
      ) : null}
    </>
  )
})

interface DetailsEditorProps {
  actionsRef: RefStateObject | undefined
  disabled?: boolean
  onSubmit: () => Promise<any>
  signers: Horizon.AccountSigner[]
  showKeyWeights?: boolean
  testnet: boolean
}

function DetailsEditor(props: DetailsEditorProps) {
  const [selectedSigner, setSelectedSigner] = React.useState<Horizon.AccountSigner | undefined>()
  const { t } = useTranslation()
  const { accounts } = React.useContext(AccountsContext)
  const { accountID, editorState, setEditorState, testnet } = React.useContext(MultisigEditorContext)
  const accountData = useLiveAccountData(accountID, testnet)
  const isSmallScreen = useIsMobile()

  const showSignerSelection =
    editorState.preset.type === MultisigPresets.Type.SingleSignature && accountData.signers.length > 1

  const selectSingleSigner = React.useCallback(
    (newlySelectedSigner: Horizon.AccountSigner) => {
      setSelectedSigner(newlySelectedSigner)
      setEditorState(prev => ({
        ...prev,
        signersToAdd: [],
        signersToRemove: accountData.signers.filter(signer => signer.key !== newlySelectedSigner.key)
      }))
    },
    [accountData, setEditorState]
  )

  const disabled = props.disabled || (showSignerSelection && !selectedSigner)

  return (
    <VerticalLayout>
      {showSignerSelection ? (
        <SignerSelector
          accounts={accounts}
          onSelect={selectSingleSigner}
          selected={selectedSigner}
          signers={accountData.signers}
          testnet={testnet}
        />
      ) : (
        <SignersEditor {...props} />
      )}
      <Box margin="32px 0 0">
        <PresetDescription preset={editorState.preset} />
      </Box>
      <Portal target={props.actionsRef?.element}>
        <DialogActionsBox desktopStyle={{ margin: 0 }}>
          <ActionButton disabled={disabled} icon={<CheckIcon />} onClick={props.onSubmit} type="submit">
            {isSmallScreen
              ? t("account-settings.manage-signers.action.apply.short")
              : t("account-settings.manage-signers.action.apply.long")}
          </ActionButton>
        </DialogActionsBox>
      </Portal>
    </VerticalLayout>
  )
}

export default React.memo(DetailsEditor)
