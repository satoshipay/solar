/**
 * Contains the action buttons for the account creation flow.
 * It needs to be mounted outside of the actual account creation view.
 */

import React from "react"
import { useTranslation } from "react-i18next"
import { makeStyles } from "@material-ui/core/styles"
import CheckIcon from "@material-ui/icons/Check"
import { useRouter } from "~Generic/hooks/userinterface"
import { matchesRoute } from "~Generic/lib/routes"
import * as routes from "~App/routes"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { useButtonStyles } from "~Account/components/AccountActions"

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
  const { t } = useTranslation()

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
              {t("create-account.action.create")}
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
              {t("create-account.action.import")}
            </ActionButton>
          )
        } else if (matchesRoute(router.location.pathname, routes.joinSharedAccount(props.testnet))) {
          return (
            <ActionButton
              className={buttonClassName}
              icon={<CheckIcon style={{ fontSize: "120%" }} />}
              onClick={props.onActionButtonClick}
              type="primary"
            >
              {t("create-account.action.join-shared")}
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
