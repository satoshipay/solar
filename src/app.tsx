/// <reference types="parcel-env" />

import "babel-polyfill"

import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router, Route, Switch } from "react-router-dom"
import { Network } from "stellar-sdk"
import { MuiThemeProvider } from "@material-ui/core/styles"
import AndroidBackButton from "./components/AndroidBackButton"
import ErrorBoundary from "./components/ErrorBoundary"
import LinkHandler from "./components/LinkHandler"
import { VerticalLayout } from "./components/Layout/Box"
import DesktopNotifications from "./components/DesktopNotifications"
import NotificationContainer from "./components/NotificationContainer"
import { AccountsProvider } from "./context/accounts"
import { CachingProvider } from "./context/caches"
import { NotificationsProvider } from "./context/notifications"
import { SettingsProvider } from "./context/settings"
import { SignatureDelegationProvider } from "./context/signatureDelegation"
import { StellarProvider } from "./context/stellar"
import AllAccountsPage from "./pages/all-accounts"
import AccountPage from "./pages/account"
import CreateAccountPage from "./pages/create-account"
import SettingsPage from "./pages/settings"
import * as routes from "./routes"
import handleSplashScreen from "./splash-screen"
import theme from "./theme"
import { TransactionRequestProvider } from "./context/transactionRequest"
import TransactionRequestHandler from "./components/TransactionRequestHandler"

Network.usePublicNetwork()

const CreateMainnetAccount = () => <CreateAccountPage testnet={false} />
const CreateTestnetAccount = () => <CreateAccountPage testnet={true} />

const Providers = (props: { children: React.ReactNode }) => (
  <Router>
    <MuiThemeProvider theme={theme}>
      <StellarProvider>
        <AccountsProvider>
          <TransactionRequestProvider>
            <SettingsProvider>
              <CachingProvider>
                <NotificationsProvider>
                  <SignatureDelegationProvider>{props.children}</SignatureDelegationProvider>
                </NotificationsProvider>
              </CachingProvider>
            </SettingsProvider>
          </TransactionRequestProvider>
        </AccountsProvider>
      </StellarProvider>
    </MuiThemeProvider>
  </Router>
)

const App = () => (
  <Providers>
    <VerticalLayout height="100%">
      <VerticalLayout height="100%" grow overflow="auto">
        <ErrorBoundary>
          <Switch>
            <Route exact path="/" component={AllAccountsPage} />
            <Route exact path="/account/create/mainnet" component={CreateMainnetAccount} />
            <Route exact path="/account/create/testnet" component={CreateTestnetAccount} />
            <Route
              path={["/account/:id/:action", "/account/:id"]}
              render={props => (
                <AccountPage
                  accountID={props.match.params.id}
                  showAssetManagement={props.match.url.startsWith(routes.manageAccountAssets(props.match.params.id))}
                  showAssetTrading={props.match.url === routes.tradeAsset(props.match.params.id)}
                  showCreatePayment={props.match.url === routes.createPayment(props.match.params.id)}
                  showReceivePayment={props.match.url === routes.receivePayment(props.match.params.id)}
                  showSignersManagement={props.match.url === routes.manageAccountSigners(props.match.params.id)}
                />
              )}
            />
            <Route exact path="/settings" component={SettingsPage} />
          </Switch>
          <DesktopNotifications />
          <TransactionRequestHandler />
          <NotificationContainer />
          {process.env.PLATFORM === "android" ? <AndroidBackButton /> : null}
          {process.env.PLATFORM === "android" || process.env.PLATFORM === "ios" ? <LinkHandler /> : null}
        </ErrorBoundary>
      </VerticalLayout>
    </VerticalLayout>
  </Providers>
)

const onRendered = () => {
  if (window.parent) {
    // for Cordova
    window.parent.postMessage("app:ready", "*")
  }
}

ReactDOM.render(<App />, document.getElementById("app"), onRendered)

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}

handleSplashScreen()
