import React from "react"
import { Route, Switch } from "react-router-dom"
import AndroidBackButton from "./components/AndroidBackButton"
import DesktopNotifications from "./components/DesktopNotifications"
import ErrorBoundary from "./components/ErrorBoundary"
import { VerticalLayout } from "./components/Layout/Box"
import LinkHandler from "./components/LinkHandler"
import ConnectionErrorListener from "./components/Toasts/ConnectionErrorListener"
import NotificationContainer from "./components/Toasts/NotificationContainer"
import AccountPage from "./pages/account"
import AllAccountsPage from "./pages/all-accounts"
import SettingsPage from "./pages/settings"
import { appIsLoaded } from "./splash-screen"

const CreateMainnetAccount = () => (
  <React.Suspense fallback={null}>
    <AccountPage accountCreation="pubnet" />
  </React.Suspense>
)

const CreateTestnetAccount = () => (
  <React.Suspense fallback={null}>
    <AccountPage accountCreation="testnet" />
  </React.Suspense>
)

function Stage2() {
  React.useEffect(() => {
    appIsLoaded()
  }, [])
  return (
    <>
      <VerticalLayout height="100%" style={{ WebkitOverflowScrolling: "touch" }}>
        <VerticalLayout height="100%" grow overflowY="hidden">
          <ErrorBoundary>
            <Switch>
              <Route exact path="/" component={AllAccountsPage} />
              <Route exact path="/account/create/mainnet" component={CreateMainnetAccount} />
              <Route exact path="/account/create/testnet" component={CreateTestnetAccount} />
              <Route
                path={["/account/:id/:action/:subaction", "/account/:id/:action", "/account/:id"]}
                render={props => (
                  <React.Suspense fallback={null}>
                    <AccountPage accountID={props.match.params.id} />
                  </React.Suspense>
                )}
              />
              <Route
                path={["/settings/:action", "/settings"]}
                render={() => (
                  <React.Suspense fallback={null}>
                    <SettingsPage />
                  </React.Suspense>
                )}
              />
            </Switch>
          </ErrorBoundary>
        </VerticalLayout>
      </VerticalLayout>
      <React.Suspense fallback={null}>
        <NotificationContainer />
        <ConnectionErrorListener />
      </React.Suspense>
      <React.Suspense fallback={null}>
        {/* Notifications need to come after the -webkit-overflow-scrolling element on iOS */}
        <DesktopNotifications />
      </React.Suspense>
      {process.env.PLATFORM === "android" ? <AndroidBackButton /> : null}
      {process.env.PLATFORM === "android" || process.env.PLATFORM === "ios" ? <LinkHandler /> : null}
    </>
  )
}

export default React.memo(Stage2)
