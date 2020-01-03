import { makeDecorator } from "@storybook/addons"
import centered from "@storybook/addon-centered/react"
import { addDecorator, configure } from "@storybook/react"
import React from "react"
import { HashRouter as Router } from "react-router-dom"
import "storybook-addon-material-ui/register"
import { muiTheme } from "storybook-addon-material-ui"
import ErrorBoundary from "../src/components/ErrorBoundary"
import ViewLoading from "../src/components/ViewLoading"
import { ContextProviders } from "../src/context"
import theme from "../src/theme"

const contextProviders = makeDecorator({
  wrapper: storyFn => React.createElement(Router, {}, React.createElement(ContextProviders, {}, storyFn()))
})

const errorBoundary = makeDecorator({
  wrapper: storyFn => React.createElement(ErrorBoundary, {}, storyFn())
})

const suspense = makeDecorator({
  wrapper: storyFn => React.createElement(React.Suspense, { fallback: React.createElement(ViewLoading) }, storyFn())
})

function loadStories() {
  require("../stories/index")
}

addDecorator(errorBoundary)
addDecorator(suspense)
addDecorator(contextProviders)
addDecorator(muiTheme([theme]))
addDecorator(centered)

configure(loadStories, module)
