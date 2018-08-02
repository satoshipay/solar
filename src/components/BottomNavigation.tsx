import React from "react"
import { History, Location } from "history"
import BottomNavigation from "@material-ui/core/BottomNavigation"
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction"
import Paper from "@material-ui/core/Paper"
import QRCodeIcon from "react-icons/lib/fa/qrcode"
import HomeIcon from "react-icons/lib/md/home"
import { withRouter } from "react-router-dom"
import * as routes from "../lib/routes"

const getSelectedIndexByPath = (path: string) => {
  if (path === routes.allAccounts() || routes.isAccountRoutePath(path)) {
    return 0
  } else if (path === routes.qrScanner()) {
    return 1
  }
  throw new Error(`Don't know what icon to show as selected in bottom navigation. Path is: ${path}`)
}

const AppBottomNavigation = (props: { history: History; location: Location }) => {
  return (
    <Paper elevation={1}>
      <BottomNavigation showLabels value={getSelectedIndexByPath(props.location.pathname)}>
        <BottomNavigationAction
          label="Accounts"
          icon={<HomeIcon style={{ fontSize: "200%" }} />}
          onClick={() => props.history.push(routes.allAccounts())}
        />
        <BottomNavigationAction
          label="QR scanner"
          icon={<QRCodeIcon style={{ fontSize: "200%" }} />}
          onClick={() => props.history.push(routes.qrScanner())}
        />
      </BottomNavigation>
    </Paper>
  )
}

export default withRouter(AppBottomNavigation)
