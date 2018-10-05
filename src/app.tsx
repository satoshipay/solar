/// <reference types="parcel-env" />

import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router, Route } from "react-router-dom"
import withProps from "recompose/withProps"
import { Network } from "stellar-sdk"
import { MuiThemeProvider } from "@material-ui/core/styles"
import NotificationContainer from "./components/NotificationContainer"
import OpenDialogs from "./components/OpenDialogs"
import AllAccountsPage from "./pages/all-accounts"
import AccountPage from "./pages/account"
import AccountAssetsPage from "./pages/account-assets"
import CreateAccountPage from "./pages/create-account"
import accounts, { networkSwitch } from "./stores/accounts"
import dialogs from "./stores/dialogs"
import notifications from "./stores/notifications"
import theme from "./theme"

Network.usePublicNetwork()

const App = () => (
  <Router>
    <MuiThemeProvider theme={theme}>
      <Route exact path="/" component={withProps({ accounts, networkSwitch })(AllAccountsPage)} />
      <Route exact path="/account/create/mainnet" component={withProps({ testnet: false })(CreateAccountPage)} />
      <Route exact path="/account/create/testnet" component={withProps({ testnet: true })(CreateAccountPage)} />
      <Route exact path="/account/:id" component={withProps({ accounts })(AccountPage)} />
      <Route exact path="/account/:id/assets" component={withProps({ accounts })(AccountAssetsPage)} />
      <NotificationContainer notifications={notifications} />
      <OpenDialogs dialogs={dialogs} />
    </MuiThemeProvider>
  </Router>
)

ReactDOM.render(<App />, document.getElementById("app"))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}

// Hide Splash Screen
setTimeout(() => {
  const splash = document.getElementById("splash")
  if (splash) {
    splash.style.opacity = "0"
    splash.style.pointerEvents = "none"

    setTimeout(() => {
      splash.style.display = "none"
    }, 1000)
  }
}, 1000)
