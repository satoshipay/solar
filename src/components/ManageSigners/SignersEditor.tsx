import React from "react"
import { Horizon } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListItemText from "@material-ui/core/ListItemText"
import PersonIcon from "@material-ui/icons/Person"
import RemoveIcon from "@material-ui/icons/Close"
import { trackError } from "../../context/notifications"
import { useFederationLookup } from "../../hooks/stellar"
import { isPublicKey, isStellarAddress } from "../../lib/stellar-address"
import SpaciousList from "../List/SpaciousList"
import { Address } from "../PublicKey"
import NewSignerForm from "./NewSignerForm"

interface SignerFormValues {
  publicKey: string
  weight: string
}

interface SignerFormErrors {
  publicKey?: Error
  weight?: Error
}

function validateNewSignerValues(values: SignerFormValues, signers: Horizon.AccountSigner[]): SignerFormErrors {
  const errors: SignerFormErrors = {}

  if (!isPublicKey(values.publicKey) && !isStellarAddress(values.publicKey)) {
    errors.publicKey = new Error("Expected a public key or stellar address.")
  } else if (signers.find(existingSigner => existingSigner.key === values.publicKey)) {
    errors.publicKey = new Error("Cannot add existing signer.")
  }
  if (!values.weight.match(/^[0-9]+$/)) {
    errors.weight = new Error("Must be an integer.")
  }

  return errors
}

interface SignersEditorProps {
  isEditingNewSigner: boolean
  setIsEditingNewSigner: (isEditingNewSigner: boolean) => void
  localPublicKey: string
  signers: Horizon.AccountSigner[]
  addSigner: (signer: Horizon.AccountSigner) => void
  removeSigner: (signer: Horizon.AccountSigner) => void
  showKeyWeights?: boolean
}

function SignersEditor(props: SignersEditorProps) {
  const { isEditingNewSigner, setIsEditingNewSigner } = props

  const { lookupFederationRecord } = useFederationLookup()
  const [newSignerErrors, setNewSignerErrors] = React.useState<SignerFormErrors>({})
  const [newSignerValues, setNewSignerValues] = React.useState<SignerFormValues>({
    publicKey: "",
    weight: "1"
  })

  const createCosigner = async () => {
    try {
      const federationRecord =
        newSignerValues.publicKey.indexOf("*") > -1 ? await lookupFederationRecord(newSignerValues.publicKey) : null

      const cosignerPublicKey = federationRecord ? federationRecord.account_id : newSignerValues.publicKey
      const errors = validateNewSignerValues(newSignerValues, props.signers)

      if (Object.keys(errors).length > 0) {
        return setNewSignerErrors(errors)
      }

      props.addSigner({
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
    <SpaciousList fitHorizontal>
      {props.signers.map(signer => (
        <ListItem key={signer.key}>
          <ListItemIcon>
            <PersonIcon style={{ fontSize: "2rem" }} />
          </ListItemIcon>
          <ListItemText
            primary={<Address address={signer.key} variant="full" />}
            secondary={
              <>
                {props.showKeyWeights ? <span style={{ marginRight: 24 }}>Weight: {signer.weight}</span> : null}
                {signer.key === props.localPublicKey ? <span>Local key</span> : null}
              </>
            }
          />
          <ListItemSecondaryAction>
            <IconButton
              aria-label="Remove"
              disabled={props.signers.length === 1}
              onClick={() => props.removeSigner(signer)}
            >
              <RemoveIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
      {isEditingNewSigner ? (
        <NewSignerForm
          errors={newSignerErrors}
          onCancel={() => setIsEditingNewSigner(false)}
          onSubmit={createCosigner}
          onUpdate={updateNewSignerValues}
          values={newSignerValues}
        />
      ) : null}
    </SpaciousList>
  )
}

export default SignersEditor
