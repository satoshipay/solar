import React from "react"
import Dialog from "@material-ui/core/Dialog"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import TextField from "@material-ui/core/TextField"
import { unstable_useMediaQuery as useMediaQuery } from "@material-ui/core/useMediaQuery"
import EditIcon from "@material-ui/icons/Edit"
import { trackError } from "../../context/notifications"
import CloseButton from "./CloseButton"
import { ActionButton, DialogActionsBox } from "./Generic"

interface Props {
  open: boolean
  onClose: () => void
  performRenaming: (newValue: string) => Promise<void>
  prevValue: string
  title: string
}

function RenameDialog(props: Props) {
  const [newName, setNewName] = React.useState("")
  const isWidthMax500 = useMediaQuery("(max-width:500px)")

  const handleInput = (event: React.SyntheticEvent) => {
    setNewName((event.target as HTMLInputElement).value)
  }

  const handleSubmit = (event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault()
    }
    props.performRenaming(newName).catch(error => trackError(error))
    props.onClose()
  }

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <CloseButton onClick={props.onClose} />
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <form style={isWidthMax500 ? { minWidth: 200 } : { minWidth: 300 }} onSubmit={handleSubmit}>
          <TextField label="Name" fullWidth autoFocus margin="dense" value={newName} onChange={handleInput} />
          <DialogActionsBox>
            <ActionButton onClick={props.onClose}>Cancel</ActionButton>
            <ActionButton icon={<EditIcon />} onClick={handleSubmit} type="primary">
              Rename
            </ActionButton>
          </DialogActionsBox>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RenameDialog
