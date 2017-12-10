import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'
import { withProps } from 'recompose'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import AppBottomNavigation from './components/BottomNavigation'
import { Box, VerticalLayout } from './layout'
import HomePage from './pages/home'
import QRScannerPage from './pages/qr-scanner'
import WalletPage from './pages/wallet'
import wallets from './stores/wallets'

const App = () => (
  <Router>
    <MuiThemeProvider>
      <VerticalLayout>
        <Box grow>
          <Route exact path='/' component={withProps({ wallets })(HomePage)}/>
          <Route path='/wallet/:id' component={withProps({ wallets })(WalletPage)}/>
          <Route path='/qr-scanner' component={QRScannerPage}/>
        </Box>
        <Box fixed>
          <AppBottomNavigation />
        </Box>
      </VerticalLayout>
    </MuiThemeProvider>
  </Router>
)

ReactDOM.render(<App />, document.getElementById('app'))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
