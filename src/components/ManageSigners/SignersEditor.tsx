import React from "react"
import { AccountRecord } from "stellar-sdk"
import IconButton from "@material-ui/core/IconButton"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListItemText from "@material-ui/core/ListItemText"
import PersonIcon from "@material-ui/icons/Person"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import RemoveIcon from "@material-ui/icons/RemoveCircle"
import { CardList } from "../CardList"
import PublicKey from "../PublicKey"
import NewSignerForm from "./NewSignerForm"
import SignerCard from "./SignerCard"

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

  addCosigner = () => {
    const { newSignerValues } = this.state
    const errors: Partial<SignersEditorState["newSignerErrors"]> = {}

    if (!newSignerValues.publicKey.match(/^G[A-Z0-9]{55}$/)) {
      errors.publicKey = new Error("Not a valid public key.")
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
    const iconStyle = { width: "1.5em", height: "1.5em", margin: "0 16px" }
    return (
      <CardList addInvisibleCard={this.props.signers.length % 2 === 0}>
        {this.props.signers.map(signer => (
          <SignerCard key={signer.public_key} icon={<PersonIcon style={iconStyle} />}>
            <ListItemText
              primary={<PublicKey publicKey={signer.public_key} variant="short" />}
              secondary={`Weight: ${signer.weight}`}
            />
            <ListItemSecondaryAction>
              {/* TODO: Edit weight */}
              <IconButton aria-label="Remove" onClick={() => this.props.removeSigner(signer)}>
                <RemoveIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </SignerCard>
        ))}
        <SignerCard
          icon={<PersonAddIcon style={iconStyle} />}
          onClick={editingNewSigner ? undefined : () => this.setState({ editingNewSigner: true })}
        >
          {editingNewSigner ? (
            <NewSignerForm
              errors={newSignerErrors}
              onSubmit={this.addCosigner}
              onUpdate={this.updateNewSignerValues}
              values={newSignerValues}
            />
          ) : (
            <ListItemText>Add co-signer</ListItemText>
          )}
        </SignerCard>
      </CardList>
    )
  }
}

export default SignersEditor
