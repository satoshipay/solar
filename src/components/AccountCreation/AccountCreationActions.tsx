import React from "react"
import { makeStyles } from "@material-ui/core/styles"
import CheckIcon from "@material-ui/icons/Check"
import { useRouter } from "../../hooks/userinterface"
import { matchesRoute } from "../../lib/routes"
import * as routes from "../../routes"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { useButtonStyles } from "../Account/AccountActions"

const useAccountCreationStyles = makeStyles({
  desktopBox: {
    margin: "16px 0",
    padding: "0 40px"
  },
  inlineButton: {
    flexBasis: "auto",
    flexGrow: 0,
    padding: "10px 20px !important"
  }
})

interface AccountCreationActionsProps {
  bottomOfScreen?: boolean
  onActionButtonClick: () => void
  testnet: boolean
}

function AccountCreationActions(props: AccountCreationActionsProps) {
  const defaultClasses = useButtonStyles()
  const customClasses = useAccountCreationStyles()

  const classes = { ...defaultClasses, ...customClasses }
  const router = useRouter()

  const boxClassName = `${props.bottomOfScreen ? classes.mobile : `${classes.desktop} ${classes.desktopBox}`}`
  const buttonClassName = `${classes.button} ${props.bottomOfScreen ? "" : classes.inlineButton}`

  return (
    <DialogActionsBox className={boxClassName}>
      {(() => {
        if (matchesRoute(router.location.pathname, routes.createAccount(props.testnet))) {
          return (
            <ActionButton
              className={buttonClassName}
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
              className={buttonClassName}
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
