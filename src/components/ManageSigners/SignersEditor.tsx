import React from "react"
import { AccountRecord } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListItemText from "@material-ui/core/ListItemText"
import PersonIcon from "@material-ui/icons/Person"
import RemoveIcon from "@material-ui/icons/Close"
import SpaciousList from "../List/SpaciousList"
import PublicKey from "../PublicKey"
import NewSignerForm from "./NewSignerForm"

type Signer = AccountRecord["signers"][0]

interface SignersEditorProps {
  signers: Signer[]
  addSigner: (signer: Signer) => void
  removeSigner: (signer: Signer) => void
}

interface SignersEditorState {
  editingNewSigner: boolean
  newSignerErrors: {
    publicKey?: Error
    weight?: Error
  }
  newSignerValues: {
    publicKey: string
    weight: string
  }
}

class SignersEditor extends React.Component<SignersEditorProps, SignersEditorState> {
  state: SignersEditorState = {
    editingNewSigner: false,
    newSignerErrors: {},
    newSignerValues: {
      publicKey: "",
      weight: "1"
    }
  }

  addAdditionalCosigner = () => {
    this.setState({ editingNewSigner: true })
  }

  cancelEditingCosigner = () => {
    this.setState({ editingNewSigner: false })
  }

  createCosigner = () => {
    const { newSignerValues } = this.state
    const errors: Partial<SignersEditorState["newSignerErrors"]> = {}

    if (!newSignerValues.publicKey.match(/^G[A-Z0-9]{55}$/)) {
      errors.publicKey = new Error("Not a valid public key.")
    } else if (this.props.signers.find(existingSigner => existingSigner.public_key === newSignerValues.publicKey)) {
      errors.publicKey = new Error("Cannot add existing signer.")
    }
    if (!newSignerValues.weight.match(/^[0-9]+$/)) {
      errors.weight = new Error("Must be an integer.")
    }

    if (Object.keys(errors).length > 0) {
      return this.setState({ newSignerErrors: errors })
    }

    this.props.addSigner({
      public_key: newSignerValues.publicKey,
      weight: parseInt(newSignerValues.weight, 10)
    })

    this.setState({
      editingNewSigner: false,
      newSignerErrors: {},
      newSignerValues: {
        publicKey: "",
        weight: "1"
      }
    })
  }

  updateNewSignerValues = (values: Partial<SignersEditorState["newSignerValues"]>) => {
    this.setState(state => ({
      newSignerValues: {
        ...state.newSignerValues,
        ...values
      }
    }))
  }

  render() {
    const { editingNewSigner, newSignerErrors, newSignerValues } = this.state
    return (
      <SpaciousList fitHorizontal>
        {this.props.signers.map(signer => (
          <ListItem key={signer.public_key}>
            <ListItemIcon>
              <PersonIcon style={{ fontSize: "2rem" }} />
            </ListItemIcon>
            <ListItemText
              primary={<PublicKey publicKey={signer.public_key} variant="full" />}
              secondary={`Weight: ${signer.weight}`}
            />
            <ListItemSecondaryAction>
              {/* TODO: Edit weight */}
              <IconButton aria-label="Remove" onClick={() => this.props.removeSigner(signer)}>
                <RemoveIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
        {editingNewSigner ? (
          <NewSignerForm
            errors={newSignerErrors}
            onCancel={this.cancelEditingCosigner}
            onSubmit={this.createCosigner}
            onUpdate={this.updateNewSignerValues}
            values={newSignerValues}
          />
        ) : null}
      </SpaciousList>
    )
  }
}

export default SignersEditor
