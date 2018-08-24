import React from "react"
import { match } from "react-router"
import { History, Location } from "history"
import BottomNavigation from "@material-ui/core/BottomNavigation"
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction"
import Paper from "@material-ui/core/Paper"
import MoneyIcon from "@material-ui/icons/AttachMoney"
import WalletIcon from "@material-ui/icons/AccountBalanceWallet"
import { withRouter } from "react-router-dom"
import * as routes from "../../routes"
import { Account } from "../../stores/accounts"

const getSelectedIndexByPath = (path: string) => {
  if (routes.isAccountBasePath(path)) {
    return 0
  } else if (routes.isAccountAssetsPath(path)) {
    return 1
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
        <BottomNavigationAction
          label="Assets"
          icon={<MoneyIcon />}
          onClick={() => props.history.push(routes.accountAssets(props.account.id))}
        />
      </BottomNavigation>
    </Paper>
  )
}

export default withRouter<Props>(AccountBottomNavigation)
