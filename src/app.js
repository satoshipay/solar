import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'
import { withProps } from 'recompose'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import AppBottomNavigation from './components/BottomNavigation'
import HomePage from './pages/home'
import QRScannerPage from './pages/qr-scanner'
import WalletPage from './pages/wallet'
import wallets from './stores/wallets'

const App = () => (
  <Router>
    <MuiThemeProvider>
      <div>
        <div>
          <Route exact path='/' component={withProps({ wallets })(HomePage)}/>
          <Route path='/wallet/:id' component={withProps({ wallets })(WalletPage)}/>
          <Route path='/qr-scanner' component={QRScannerPage}/>
        </div>
        <AppBottomNavigation />
      </div>
    </MuiThemeProvider>
  </Router>
)

ReactDOM.render(<App />, document.getElementById('app'))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
