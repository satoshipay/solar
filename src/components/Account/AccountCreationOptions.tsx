import React from "react"
import List from "@material-ui/core/List"
import { makeStyles } from "@material-ui/core/styles"
import { useIsMobile } from "../../hooks/userinterface"

const useAccountCreationStyles = makeStyles({
  buttonListItem: {}
})

function AccountCreationOptions() {
  const classes = useAccountCreationStyles()
  const isSmallScreen = useIsMobile()

  return (
    <List style={{ padding: isSmallScreen ? 0 : "24px 16px" }}>
      {
        /* TODO:
         * - Password setting
         * - Secret key import
         */
        null
      }
    </List>
  )
}

export default React.memo(AccountCreationOptions)
