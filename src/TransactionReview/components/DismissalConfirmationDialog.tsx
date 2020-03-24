import React from "react"
import { ActionButton, ConfirmDialog } from "~Dialog/components/Generic"

interface Props {
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}

function DismissalConfirmationDialog(props: Props) {
  return (
    <ConfirmDialog
      cancelButton={<ActionButton onClick={props.onCancel}>Cancel</ActionButton>}
      confirmButton={
        <ActionButton onClick={props.onConfirm} type="primary">
          Confirm
        </ActionButton>
      }
      onClose={props.onCancel}
      open={props.open}
      title="Confirm"
    >
      Dismiss pending multi-signature transaction?
    </ConfirmDialog>
  )
}

export default DismissalConfirmationDialog
