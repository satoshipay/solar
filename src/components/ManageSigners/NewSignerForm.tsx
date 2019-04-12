import React from "react"
import IconButton from "@material-ui/core/IconButton"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import TextField from "@material-ui/core/TextField"
import CheckIcon from "@material-ui/icons/Check"
import CloseIcon from "@material-ui/icons/Close"
import PersonAddIcon from "@material-ui/icons/PersonAdd"
import { useIsSmallMobile, useIsMobile } from "../../hooks"
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
  const isSmallScreen = useIsMobile()
  const isTinyScreen = useIsSmallMobile()

  return (
    <ListItem>
      <ListItemIcon>
        <PersonAddIcon style={{ fontSize: "2rem" }} />
      </ListItemIcon>
      <ListItemText>
        <HorizontalLayout>
          <TextField
            autoFocus={process.env.PLATFORM !== "ios"}
            error={!!props.errors.publicKey}
            label={props.errors.publicKey ? props.errors.publicKey.message : "Public Key or Stellar Address"}
            placeholder={isSmallScreen ? "GABC… or address" : "GABCDEFGHIJK… or alice*example.org"}
            onChange={event => props.onUpdate({ publicKey: event.target.value })}
            style={{ flexGrow: 1 }}
            InputProps={isTinyScreen ? { style: { fontSize: "0.8rem" } } : undefined}
            value={props.values.publicKey}
          />
        </HorizontalLayout>
      </ListItemText>
      <ListItemIcon style={isTinyScreen ? { padding: 0, margin: 0 } : { marginRight: 8 }}>
        <IconButton onClick={props.onSubmit}>
          <CheckIcon />
        </IconButton>
      </ListItemIcon>
      <ListItemIcon>
        <IconButton
          onClick={props.onCancel}
          style={isTinyScreen ? { padding: 0, marginRight: -24 } : { marginRight: -24 }}
        >
          <CloseIcon />
        </IconButton>
      </ListItemIcon>
    </ListItem>
  )
}

export default NewSignerForm
