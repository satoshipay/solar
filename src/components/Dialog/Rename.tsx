import React from "react"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import TextField from "@material-ui/core/TextField"
import EditIcon from "@material-ui/icons/Edit"
import { trackError } from "../../context/notifications"
import { useIsMobile } from "../../hooks"
import { VerticalLayout } from "../Layout/Box"
import { ActionButton, CloseButton, DialogActionsBox } from "./Generic"

interface Props {
  onClose: () => void
  performRenaming: (newValue: string) => Promise<void>
  prevValue: string
  title: string
}

function RenameDialog(props: Props) {
  const [newName, setNewName] = React.useState(props.prevValue)
  const isSmallScreen = useIsMobile()

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
    <VerticalLayout minWidth={250}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <form style={{ minWidth: isSmallScreen ? 120 : 400 }} onSubmit={handleSubmit}>
          <TextField
            autoFocus={process.env.PLATFORM !== "ios"}
            fullWidth
            label="Name"
            margin="dense"
            onChange={handleInput}
            value={newName}
          />
          <DialogActionsBox smallDialog>
            <CloseButton onClick={props.onClose} />
            <ActionButton icon={<EditIcon />} onClick={handleSubmit} type="primary">
              Rename
            </ActionButton>
          </DialogActionsBox>
        </form>
      </DialogContent>
    </VerticalLayout>
  )
}

export default React.memo(RenameDialog)
