import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom'
import { withProps } from 'recompose'
import HomePage from './pages/home'
import wallets from './stores/wallets'

const App = () => (
  <Router>
    <Route exact path='/' component={withProps({ wallets })(HomePage)}/>
  </Router>
)

ReactDOM.render(<App />, document.getElementById('app'))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
