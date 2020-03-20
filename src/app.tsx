/// <reference types="parcel-env" />

import "threads/register"
import React from "react"
import ReactDOM from "react-dom"
import { HashRouter as Router } from "react-router-dom"
import SmoothScroll from "smoothscroll-polyfill"
import { MuiThemeProvider } from "@material-ui/core/styles"
import ViewLoading from "./components/Generic/ViewLoading"
import { ContextProviders } from "./context"
import handleSplashScreen from "./splash-screen"
import theme from "./theme"
import "./worker-controller"
import "./lib/i18n"

SmoothScroll.polyfill()

const Stage2 = React.lazy(() => import("./app-stage2"))

export const Providers = (props: { children: React.ReactNode }) => (
  <Router>
    <MuiThemeProvider theme={theme}>
      <ContextProviders>{props.children}</ContextProviders>
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
