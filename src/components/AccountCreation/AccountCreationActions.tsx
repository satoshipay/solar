import React from "react"
import CheckIcon from "@material-ui/icons/Check"
import { useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { useButtonStyles } from "../Account/AccountActions"

interface AccountCreationActionsProps {
  bottomOfScreen?: boolean
  onActionButtonClick: () => void
  testnet: boolean
}

function AccountCreationActions(props: AccountCreationActionsProps) {
  const classes = useButtonStyles()
  const router = useRouter()
  const className = `${props.bottomOfScreen ? classes.mobile : classes.desktop}`
  return (
    <DialogActionsBox className={className}>
      {(() => {
        if (matchesRoute(router.location.pathname, routes.createAccount(props.testnet))) {
          return (
            <ActionButton
              className={classes.button}
              icon={<CheckIcon style={{ fontSize: "120%" }} />}
              onClick={props.onActionButtonClick}
              type="primary"
            >
              Create Account
            </ActionButton>
          )
        } else if (matchesRoute(router.location.pathname, routes.importAccount(props.testnet))) {
          return (
            <ActionButton
              className={classes.button}
              icon={<CheckIcon style={{ fontSize: "120%" }} />}
              onClick={props.onActionButtonClick}
              type="primary"
            >
              Import Account
            </ActionButton>
          )
        } else {
          return null
        }
      })()}
    </DialogActionsBox>
  )
}

export default React.memo(AccountCreationActions)
