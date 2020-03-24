import { makeDecorator } from "@storybook/addons"
import centered from "@storybook/addon-centered/react"
import { addDecorator, configure } from "@storybook/react"
import React from "react"
import { HashRouter as Router } from "react-router-dom"
import "storybook-addon-material-ui/register"
import { muiTheme } from "storybook-addon-material-ui"
import ErrorBoundary from "../src/Generic/components/ErrorBoundary"
import ViewLoading from "../src/Generic/components/ViewLoading"
import { ContextProviders } from "../src/App/bootstrap/context"
import theme from "../src/App/theme"
import "../src/App/i18n"

const contextProviders = makeDecorator({
  wrapper: storyFn => React.createElement(Router, {}, React.createElement(ContextProviders, {}, storyFn()))
})

const errorBoundary = makeDecorator({
  wrapper: storyFn => React.createElement(ErrorBoundary, {}, storyFn())
})

const suspense = makeDecorator({
  wrapper: storyFn => React.createElement(React.Suspense, { fallback: React.createElement(ViewLoading) }, storyFn())
})

function importAll(requireContext) {
  requireContext.keys().forEach(requireContext)
}

function loadStories() {
  importAll(require.context("../src", true, /stories\/index.ts$/))
}

addDecorator(errorBoundary)
addDecorator(suspense)
addDecorator(contextProviders)
addDecorator(muiTheme([theme]))
addDecorator(centered)

configure(loadStories, module)
