/// <reference types="parcel-env" />

import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router, Route, Switch } from "react-router-dom"
import { Network } from "stellar-sdk"
import { MuiThemeProvider } from "@material-ui/core/styles"
import { VerticalLayout } from "./components/Layout/Box"
import DesktopNotifications from "./components/DesktopNotifications"
import NotificationContainer from "./components/NotificationContainer"
import { AccountsProvider } from "./context/accounts"
import { NotificationsProvider } from "./context/notifications"
import { SettingsProvider } from "./context/settings"
import { SignatureDelegationProvider } from "./context/signatureDelegation"
import AllAccountsPage from "./pages/all-accounts"
import AccountPage from "./pages/account"
import CreateAccountPage from "./pages/create-account"
import SettingsPage from "./pages/settings"
import * as routes from "./routes"
import theme from "./theme"

Network.usePublicNetwork()

const CreateMainnetAccount = () => <CreateAccountPage testnet={false} />
const CreateTestnetAccount = () => <CreateAccountPage testnet={true} />

const Providers = (props: { children: React.ReactNode }) => (
  <AccountsProvider>
    <SettingsProvider>
      <NotificationsProvider>
        <SignatureDelegationProvider>{props.children}</SignatureDelegationProvider>
      </NotificationsProvider>
    </SettingsProvider>
  </AccountsProvider>
)

const App = () => (
  <Router>
    <MuiThemeProvider theme={theme}>
      <Providers>
        <VerticalLayout height="100%">
          <VerticalLayout height="100%" grow overflow="auto">
            <Switch>
              <Route exact path="/" component={AllAccountsPage} />
              <Route exact path="/account/create/mainnet" component={CreateMainnetAccount} />
              <Route exact path="/account/create/testnet" component={CreateTestnetAccount} />
              <Route
                path="/account/:id/:action?"
                render={props => (
                  <AccountPage
                    accountID={props.match.params.id}
                    showAssetManagement={props.match.url === routes.manageAccountAssets(props.match.params.id)}
                    showCreatePayment={props.match.url === routes.createPayment(props.match.params.id)}
                    showReceivePayment={props.match.url === routes.receivePayment(props.match.params.id)}
                    showSignersManagement={props.match.url === routes.manageAccountSigners(props.match.params.id)}
                  />
                )}
              />
              <Route exact path="/settings" component={SettingsPage} />
            </Switch>
            <DesktopNotifications />
            <NotificationContainer />
          </VerticalLayout>
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
