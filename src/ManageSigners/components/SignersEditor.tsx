import React from "react"
import { useTranslation } from "react-i18next"
import { Horizon } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import Divider from "@material-ui/core/Divider"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListItemText from "@material-ui/core/ListItemText"
import AddIcon from "@material-ui/icons/Add"
import PersonIcon from "@material-ui/icons/Person"
import RemoveIcon from "@material-ui/icons/RemoveCircle"
import { AccountsContext } from "~App/contexts/accounts"
import { trackError } from "~App/contexts/notifications"
import ButtonListItem from "~Generic/components/ButtonListItem"
import { Address } from "~Generic/components/PublicKey"
import { useFederationLookup } from "~Generic/hooks/stellar"
import { useIsMobile } from "~Generic/hooks/userinterface"
import { isPublicKey, isStellarAddress } from "~Generic/lib/stellar-address"
import { requiresSignatureThreshold } from "../lib/editor"
import { MultisigEditorContext } from "./MultisigEditorContext"
import NewSignerForm from "./NewSignerForm"
import ThresholdInput from "./ThresholdInput"

interface SignerFormValues {
  publicKey: string
  weight: string
}

interface SignerFormErrors {
  publicKey?: Error
  weight?: Error
}

function useFormValidation() {
  const { t } = useTranslation()
  return function validateNewSignerValues(
    values: SignerFormValues,
    signers: Horizon.AccountSigner[]
  ): SignerFormErrors {
    const errors: SignerFormErrors = {}

    if (!isPublicKey(values.publicKey) && !isStellarAddress(values.publicKey)) {
      errors.publicKey = new Error(
        t("account-settings.manage-signers.signers-editor.validation.invalid-stellar-address")
      )
    } else if (signers.find(existingSigner => existingSigner.key === values.publicKey)) {
      errors.publicKey = new Error(t("account-settings.manage-signers.signers-editor.validation.existing-signer"))
    }
    if (!values.weight.match(/^[0-9]+$/)) {
      errors.weight = new Error(t("account-settings.manage-signers.signers-editor.validation.integer-required"))
    }

    return errors
  }
}

const listItemStyles: React.CSSProperties = {
  background: "white",
  boxShadow: "0 8px 12px 0 rgba(0, 0, 0, 0.1)"
}

interface SignersEditorProps {
  signers: Horizon.AccountSigner[]
  showKeyWeights?: boolean
  testnet: boolean
}

function SignersEditor(props: SignersEditorProps) {
  const { accounts } = React.useContext(AccountsContext)
  const { editorState, setEditorState, testnet } = React.useContext(MultisigEditorContext)
  const { lookupFederationRecord } = useFederationLookup()
  const isSmallScreen = useIsMobile()
  const validateNewSignerValues = useFormValidation()

  const { t } = useTranslation()
  const { preset } = editorState

  const [isEditingNewSigner, setIsEditingNewSigner] = React.useState(false)
  const [newSignerErrors, setNewSignerErrors] = React.useState<SignerFormErrors>({})
  const [newSignerValues, setNewSignerValues] = React.useState<SignerFormValues>({
    publicKey: "",
    weight: "1"
  })

  const editNewSigner = React.useCallback(() => setIsEditingNewSigner(true), [setIsEditingNewSigner])

  const addSigner = (signer: Horizon.AccountSigner) =>
    setEditorState(prev => ({
      ...prev,
      signersToAdd: [...prev.signersToAdd, signer]
    }))

  const removeSigner = (signer: Horizon.AccountSigner) =>
    setEditorState(prev => ({
      ...prev,
      signersToAdd: prev.signersToAdd.filter(someSignerToBeAddd => someSignerToBeAddd.key !== signer.key),
      signersToRemove: [...prev.signersToRemove, signer]
    }))

  const createCosigner = async () => {
    try {
      const federationRecord =
        newSignerValues.publicKey.indexOf("*") > -1 ? await lookupFederationRecord(newSignerValues.publicKey) : null

      const cosignerPublicKey = federationRecord ? federationRecord.account_id : newSignerValues.publicKey
      const errors = validateNewSignerValues(newSignerValues, props.signers)

      if (Object.keys(errors).length > 0) {
        return setNewSignerErrors(errors)
      }

      addSigner({
        key: cosignerPublicKey,
        type: "ed25519_public_key",
        weight: parseInt(newSignerValues.weight, 10)
      })

      setIsEditingNewSigner(false)
      setNewSignerErrors({})
      setNewSignerValues({
        publicKey: "",
        weight: "1"
      })
    } catch (error) {
      trackError(error)
    }
  }

  const updateNewSignerValues = (values: Partial<SignerFormValues>) => {
    setNewSignerValues(prevValues => ({
      ...prevValues,
      ...values
    }))
  }

  return (
    <List disablePadding={isSmallScreen}>
      {isEditingNewSigner ? (
        <NewSignerForm
          errors={newSignerErrors}
          onCancel={() => setIsEditingNewSigner(false)}
          onSubmit={createCosigner}
          onUpdate={updateNewSignerValues}
          style={listItemStyles}
          values={newSignerValues}
        />
      ) : (
        <ButtonListItem gutterBottom onClick={editNewSigner}>
          <AddIcon />
          &nbsp;&nbsp;
          {t("account-settings.manage-signers.action.add-signer")}
        </ButtonListItem>
      )}
      {props.signers.map(signer => (
        <ListItem key={signer.key} style={listItemStyles}>
          <ListItemIcon>
            <PersonIcon style={{ fontSize: "2rem" }} />
          </ListItemIcon>
          <ListItemText
            primary={<Address address={signer.key} testnet={props.testnet} variant="full" />}
            secondary={
              <>
                {props.showKeyWeights ? (
                  <span style={{ marginRight: 24 }}>
                    {t("account-settings.manage-signers.signers-editor.list.item.weight")}: {signer.weight}
                  </span>
                ) : null}
                {accounts.some(account => account.publicKey === signer.key && account.testnet === testnet) ? (
                  <span>{t("account-settings.manage-signers.signers-editor.list.item.local-key")}</span>
                ) : null}
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton aria-label="Remove" disabled={props.signers.length === 1} onClick={() => removeSigner(signer)}>
              <RemoveIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
      {requiresSignatureThreshold(preset) ? (
        <>
          <ListItem style={listItemStyles}>
            <ListItemIcon>
              <div />
            </ListItemIcon>
            <ListItemText
              primary={t("account-settings.manage-signers.signers-editor.threshold.primary")}
              secondary={t("account-settings.manage-signers.signers-editor.threshold.secondary")}
              style={{ flexGrow: 0, marginRight: 32 }}
            />
            <ListItemText>
              <ThresholdInput />
            </ListItemText>
          </ListItem>
          <Divider />
        </>
      ) : null}
    </List>
  )
}

export default SignersEditor
