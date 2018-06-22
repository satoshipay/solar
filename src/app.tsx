import React from 'react'
import ReactDOM from 'react-dom'
import {
  HashRouter as Router,
  Route
} from 'react-router-dom'
import { withProps } from 'recompose'
import Paper from '@material-ui/core/Paper'
import { Network } from 'stellar-sdk'
import AppBottomNavigation from './components/BottomNavigation'
import Overlays from './components/Overlays'
import { Box, VerticalLayout } from './components/Layout/Box'
import AllWalletsPage from './pages/all-wallets'
import QRScannerPage from './pages/qr-scanner'
import WalletPage from './pages/wallet'
import overlays from './stores/overlays'
import wallets from './stores/wallets'

Network.usePublicNetwork()

const App = () => (
  <Router>
    <VerticalLayout width='100%' height='100%'>
      <Box grow overflow='auto'>
        <Route exact path='/' component={withProps({ wallets })(AllWalletsPage)} />
        <Route path='/wallet/:id' component={withProps({ wallets })(WalletPage)} />
        <Route path='/qr-scanner' component={QRScannerPage} />
      </Box>
      <Paper style={{ flexGrow: 0, flexShrink: 0, zIndex: 1 }}>
        <AppBottomNavigation />
      </Paper>
      <Overlays overlays={overlays} />
    </VerticalLayout>
  </Router>
)

ReactDOM.render(<App />, document.getElementById('app'))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
