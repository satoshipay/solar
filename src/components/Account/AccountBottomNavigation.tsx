import React from "react"
import { match } from "react-router"
import { History, Location } from "history"
import BottomNavigation from "@material-ui/core/BottomNavigation"
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction"
import Paper from "@material-ui/core/Paper"
import WalletIcon from "@material-ui/icons/AccountBalanceWallet"
import { withRouter } from "react-router-dom"
import * as routes from "../../lib/routes"
import { Account } from "../../stores/accounts"

const getSelectedIndexByPath = (path: string) => {
  if (routes.isAccountRoutePath(path)) {
    return 0
  }
  throw new Error(`Don't know what icon to show as selected in bottom navigation. Path is: ${path}`)
}

interface Props {
  account: Account
  history: History
  location: Location
  match: match<{ id: string }>
}

const AccountBottomNavigation = (props: Props) => {
  return (
    <Paper elevation={2}>
      <BottomNavigation showLabels value={getSelectedIndexByPath(props.location.pathname)}>
        <BottomNavigationAction
          label="Account"
          icon={<WalletIcon />}
          onClick={() => props.history.push(routes.account(props.account.id))}
        />
      </BottomNavigation>
    </Paper>
  )
}

export default withRouter<Props>(AccountBottomNavigation)
