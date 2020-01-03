/// <reference types="parcel-env" />

import "threads/register"
import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router } from "react-router-dom"
import SmoothScroll from "smoothscroll-polyfill"
import { MuiThemeProvider } from "@material-ui/core/styles"
import ViewLoading from "./components/ViewLoading"
import { AccountsProvider } from "./context/accounts"
import { CachingProviders } from "./context/caches"
import { NotificationsProvider } from "./context/notifications"
import { SettingsProvider } from "./context/settings"
import { SignatureDelegationProvider } from "./context/signatureDelegation"
import { StellarProvider } from "./context/stellar"
import handleSplashScreen from "./splash-screen"
import theme from "./theme"
import "./worker-controller"

SmoothScroll.polyfill()

const Stage2 = React.lazy(() => import("./app-stage2"))

const Providers = (props: { children: React.ReactNode }) => (
  <Router>
    <MuiThemeProvider theme={theme}>
      <StellarProvider>
        <AccountsProvider>
          <SettingsProvider>
            <CachingProviders>
              <NotificationsProvider>
                <SignatureDelegationProvider>{props.children}</SignatureDelegationProvider>
              </NotificationsProvider>
            </CachingProviders>
          </SettingsProvider>
        </AccountsProvider>
      </StellarProvider>
    </MuiThemeProvider>
  </Router>
)

const App = () => (
  <Providers>
    <React.Suspense fallback={<ViewLoading />}>
      <Stage2 />
    </React.Suspense>
  </Providers>
)

ReactDOM.render(<App />, document.getElementById("app"))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}

handleSplashScreen()
