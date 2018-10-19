/// <reference types="parcel-env" />

import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router, Route } from "react-router-dom"
import withProps from "recompose/withProps"
import { Network } from "stellar-sdk"
import { MuiThemeProvider } from "@material-ui/core/styles"
import { VerticalLayout } from "./components/Layout/Box"
import NotificationContainer from "./components/NotificationContainer"
import OpenDialogs from "./components/OpenDialogs"
import { AccountsProvider } from "./context/accounts"
import { DialogsProvider } from "./context/dialogs"
import { NotificationsProvider } from "./context/notifications"
import AllAccountsPage from "./pages/all-accounts"
import AccountPage from "./pages/account"
import AccountAssetsPage from "./pages/account-assets"
import CreateAccountPage from "./pages/create-account"
import theme from "./theme"

Network.usePublicNetwork()

const Providers = (props: { children: React.ReactNode }) => {
  return (
    <AccountsProvider>
      <DialogsProvider>
        <NotificationsProvider>{props.children}</NotificationsProvider>
      </DialogsProvider>
    </AccountsProvider>
  )
}

const App = () => (
  <Router>
    <MuiThemeProvider theme={theme}>
      <Providers>
        <VerticalLayout height="100%">
          <Route exact path="/" component={AllAccountsPage} />
          <Route exact path="/account/create/mainnet" component={withProps({ testnet: false })(CreateAccountPage)} />
          <Route exact path="/account/create/testnet" component={withProps({ testnet: true })(CreateAccountPage)} />
          <Route exact path="/account/:id" component={AccountPage} />
          <Route exact path="/account/:id/assets" component={AccountAssetsPage} />
          <NotificationContainer />
          <OpenDialogs />
        </VerticalLayout>
      </Providers>
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
