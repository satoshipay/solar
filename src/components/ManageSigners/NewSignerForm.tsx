import React from "react"
import IconButton from "@material-ui/core/IconButton"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import { HorizontalLayout } from "../Layout/Box"

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
  onCancel: () => void
  onSubmit: () => void
  onUpdate: (values: Partial<FormValues>) => void
}

function NewSignerForm(props: Props) {
  return (
    <ListItem>
      <ListItemIcon>
        <PersonAddIcon style={{ fontSize: "2rem" }} />
      </ListItemIcon>
      <ListItemText>
        <HorizontalLayout>
          <TextField
            autoFocus
            error={!!props.errors.publicKey}
            label={props.errors.publicKey ? props.errors.publicKey.message : "Public Key"}
            onChange={event => props.onUpdate({ publicKey: event.target.value })}
            style={{ flexGrow: 1 }}
            value={props.values.publicKey}
          />
        </HorizontalLayout>
      </ListItemText>
      <ListItemIcon style={{ marginRight: 8 }}>
        <IconButton onClick={props.onSubmit}>
          <CheckIcon />
        </IconButton>
      </ListItemIcon>
      <ListItemIcon>
        <IconButton onClick={props.onCancel} style={{ marginRight: -24 }}>
          <CloseIcon />
        </IconButton>
      </ListItemIcon>
    </ListItem>
  )
}

export default NewSignerForm
