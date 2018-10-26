import React from "react"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"

interface FormValues {
  publicKey: string
  weight: string
}

interface FormErrors {
  publicKey?: Error
  weight?: Error
}

interface Props {
  errors: FormErrors
  values: FormValues
  onSubmit: () => void
  onUpdate: (values: Partial<FormValues>) => void
}

const NewSignerForm = (props: Props) => {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <TextField
        autoFocus
        error={!!props.errors.publicKey}
        label="Public Key"
        onChange={event => props.onUpdate({ publicKey: event.target.value })}
        style={{ flexGrow: 1 }}
        value={props.values.publicKey}
      />
      <TextField
        error={!!props.errors.weight}
        label="Weight"
        onChange={event => props.onUpdate({ weight: event.target.value })}
        style={{ maxWidth: 50, marginLeft: 16 }}
        value={props.values.weight}
      />
      <IconButton onClick={props.onSubmit} style={{ marginRight: -24 }}>
        <CheckIcon style={{ width: "1.5em", height: "1.5em" }} />
      </IconButton>
    </div>
  )
}

export default NewSignerForm
