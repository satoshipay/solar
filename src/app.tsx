/// <reference types="parcel-env" />

import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router, Route } from "react-router-dom"
import { withProps } from "recompose"
import { Network } from "stellar-sdk"
import NotificationContainer from "./components/NotificationContainer"
import OpenDialogs from "./components/OpenDialogs"
import { DialogsProvider } from "./context/dialogs"
import AllAccountsPage from "./pages/all-accounts"
import AccountPage from "./pages/account"
import AccountAssetsPage from "./pages/account-assets"
import accounts, { networkSwitch } from "./stores/accounts"
import notifications from "./stores/notifications"

Network.usePublicNetwork()

const App = () => (
  <Router>
    <DialogsProvider>
      <Route exact path="/" component={withProps({ accounts, networkSwitch })(AllAccountsPage)} />
      <Route exact path="/account/:id" component={withProps({ accounts })(AccountPage)} />
      <Route exact path="/account/:id/assets" component={withProps({ accounts })(AccountAssetsPage)} />
      <NotificationContainer notifications={notifications} />
      <OpenDialogs />
    </DialogsProvider>
  </Router>
)

ReactDOM.render(<App />, document.getElementById("app"))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
