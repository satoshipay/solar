import React from "react"
import { useTranslation } from "react-i18next"
import List from "@material-ui/core/List"
import ListItemText from "@material-ui/core/ListItemText"
import Radio from "@material-ui/core/Radio"
import RadioGroup from "@material-ui/core/RadioGroup"
import Typography from "@material-ui/core/Typography"
import RightIcon from "@material-ui/icons/KeyboardArrowRight"
import AccountSettingsItem from "~AccountSettings/components/AccountSettingsItem"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import Portal from "~Generic/components/Portal"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { RefStateObject } from "~Generic/hooks/userinterface"
import { VerticalLayout } from "~Layout/components/Box"
import { MultisigPreset, MultisigPresets } from "../lib/editor"
import { MultisigEditorContext } from "./MultisigEditorContext"

interface PresetSelectorItemProps {
  onChange: () => void
  primary: React.ReactNode
  secondary: React.ReactNode
  selected: boolean
}

const PresetSelectorItem = React.memo(function PresetSelectorItem(props: PresetSelectorItemProps) {
  return (
    <AccountSettingsItem
      icon={<Radio checked={props.selected} color="primary" onChange={props.onChange} />}
      onClick={props.onChange}
    >
      <ListItemText primary={props.primary} secondary={props.secondary} />
    </AccountSettingsItem>
  )
})

interface PresetSelectorProps {
  actionsRef: RefStateObject | undefined
  onProceed: () => void
  style?: React.CSSProperties
}

function PresetSelector(props: PresetSelectorProps) {
  const { accountID, editorState, setEditorState, testnet } = React.useContext(MultisigEditorContext)
  const { t } = useTranslation()
  const accountData = useLiveAccountData(accountID, testnet)
  const minKeyWeight = Math.min(...accountData.signers.map(signer => signer.weight))

  // Signers editor only makes sense for multi-sig setups or when switching back to single sig
  const canProceed = editorState.preset.type !== MultisigPresets.Type.SingleSignature || accountData.signers.length > 1

  const setPreset = (preset: MultisigPreset) =>
    setEditorState(prev => ({
      ...prev,
      preset
    }))

  return (
    <VerticalLayout>
      <Typography gutterBottom style={{ marginLeft: 8, marginRight: 8 }} variant="h6">
        {t("account-settings.manage-signers.preset-selector.title")}
      </Typography>
      <RadioGroup>
        <List style={props.style}>
          <PresetSelectorItem
            onChange={() => setPreset({ type: MultisigPresets.Type.SingleSignature })}
            primary={t("account-settings.manage-signers.preset-selector.options.single-signature.primary")}
            selected={editorState.preset.type === MultisigPresets.Type.SingleSignature}
            secondary={t("account-settings.manage-signers.preset-selector.options.single-signature.secondary")}
          />
          <PresetSelectorItem
            onChange={() =>
              setPreset({
                requiredKeyWeight: accountData.thresholds.high_threshold || minKeyWeight,
                type: MultisigPresets.Type.MOutOfN
              })
            }
            primary={t("account-settings.manage-signers.preset-selector.options.m-out-of-n.primary")}
            selected={editorState.preset.type === MultisigPresets.Type.MOutOfN}
            secondary={t("account-settings.manage-signers.preset-selector.options.m-out-of-n.secondary")}
          />
          <PresetSelectorItem
            onChange={() => setPreset({ type: MultisigPresets.Type.OneOutOfN })}
            primary={t("account-settings.manage-signers.preset-selector.options.one-out-of-n.primary")}
            selected={editorState.preset.type === MultisigPresets.Type.OneOutOfN}
            secondary={t("account-settings.manage-signers.preset-selector.options.one-out-of-n.secondary")}
          />
        </List>
      </RadioGroup>
      <Portal target={props.actionsRef?.element}>
        <DialogActionsBox desktopStyle={{ margin: 0 }}>
          <ActionButton disabled={!canProceed} icon={<RightIcon />} onClick={props.onProceed} type="submit">
            {t("account-settings.manage-signers.action.proceed")}
          </ActionButton>
        </DialogActionsBox>
      </Portal>
    </VerticalLayout>
  )
}

export default React.memo(PresetSelector)
