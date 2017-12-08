import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

const MainSection = styled.main`
  margin: 25% auto;
  text-align: center;
`

const App = () => <MainSection>Zaster web wallet</MainSection>

ReactDOM.render(<App />, document.getElementById('app'))

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
}
