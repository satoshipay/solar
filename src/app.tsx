/// <reference types="parcel-env" />

import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router, Route } from "react-router-dom"
import { withProps } from "recompose"
import Paper from "@material-ui/core/Paper"
import { Network } from "stellar-sdk"
import AppBottomNavigation from "./components/BottomNavigation"
import ErrorNotificationContainer from "./components/ErrorNotificationContainer"
import OpenDialogs from "./components/OpenDialogs"
import { Box, VerticalLayout } from "./components/Layout/Box"
import AllAccountsPage from "./pages/all-accounts"
import QRScannerPage from "./pages/qr-scanner"
import AccountPage from "./pages/account"
import accounts from "./stores/accounts"
import dialogs from "./stores/dialogs"
import errors from "./stores/errors"

Network.usePublicNetwork()

const App = () => (
  <Router>
    <VerticalLayout width="100%" height="100%">
      <Box grow overflow="auto">
        <Route
          exact
          path="/"
          component={withProps({ accounts })(AllAccountsPage)}
        />
        <Route
          path="/account/:id"
          component={withProps({ accounts })(AccountPage)}
        />
        <Route path="/qr-scanner" component={QRScannerPage} />
      </Box>
      <Paper style={{ flexGrow: 0, flexShrink: 0, zIndex: 1 }}>
        <AppBottomNavigation />
      </Paper>
      <ErrorNotificationContainer errors={errors} />
      <OpenDialogs dialogs={dialogs} />
    </VerticalLayout>
  </Router>
)

ReactDOM.render(<App />, document.getElementById("app"))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
