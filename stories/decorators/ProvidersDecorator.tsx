import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

const ProvidersDecorator = (storyFn: Function) => (
  <MuiThemeProvider>
    {storyFn()}
  </MuiThemeProvider>
)

export default ProvidersDecorator
