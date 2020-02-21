import React from "react"
import CheckIcon from "@material-ui/icons/Check"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { useButtonStyles } from "./AccountActions"

interface AccountCreationActionsProps {
  bottomOfScreen?: boolean
  onCreateAccount: () => void
}

function AccountCreationActions(props: AccountCreationActionsProps) {
  const classes = useButtonStyles()
  const className = `${props.bottomOfScreen ? classes.mobile : classes.desktop}`
  return (
    <DialogActionsBox className={className}>
      <ActionButton
        className={classes.button}
        icon={<CheckIcon style={{ fontSize: "120%" }} />}
        onClick={props.onCreateAccount}
        type="primary"
      >
        Create Account
      </ActionButton>
    </DialogActionsBox>
  )
}

export default React.memo(AccountCreationActions)
