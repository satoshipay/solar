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

const NewSignerForm = (props: Props) => {
  return (
    <ListItem>
      <ListItemIcon>
        <PersonAddIcon />
      </ListItemIcon>
      <ListItemText>
        <HorizontalLayout>
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
        </HorizontalLayout>
      </ListItemText>
      <ListItemIcon>
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
