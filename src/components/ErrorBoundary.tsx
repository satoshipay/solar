import React from "react"
import { Translation } from "react-i18next"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { getErrorTranslation } from "../lib/errors"
import { Box, VerticalLayout } from "./Layout/Box"

// tslint:disable-next-line
const pkg = require("../../package.json")

const buttonLabels = ["Oh no", "Drats!", "Nevermind", "Let's try this again", "Not my day"]

interface Props {
  children: React.ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  state: State = {
    error: null
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // tslint:disable-next-line no-console
    console.error(`Component errored: ${error.stack || error}\n${info.componentStack}`)
  }

  reload = () => {
    window.location.reload()
  }

  render() {
    const { error } = this.state

    if (error) {
      return (
        <VerticalLayout
          alignItems="center"
          grow
          height="100%"
          justifyContent="center"
          padding="40px"
          position="relative"
        >
          <Box textAlign="center">
            <Typography variant="h5">Oops, something went wrong...</Typography>
            <Typography style={{ margin: "8px 0 24px", userSelect: "text" }} variant="body2">
              <Translation>{t => <>{getErrorTranslation(error, t)}</>}</Translation>
            </Typography>
            <Button color="primary" onClick={this.reload} variant="contained">
              {buttonLabels[Math.floor(Math.random() * buttonLabels.length)]}
            </Button>
          </Box>
          <Box style={{ position: "absolute", bottom: 8, left: 0, width: "100%", opacity: 0.5 }}>
            <Typography align="center" color="textPrimary">
              Contact us via{" "}
              <a href="mailto:hello@solarwallet.io" style={{ color: "inherit" }} target="_blank">
                hello@solarwallet.io
              </a>
            </Typography>
            <Typography align="center" color="textPrimary">
              v{pkg.version}
            </Typography>
          </Box>
        </VerticalLayout>
      )
    } else {
      return <>{this.props.children}</>
    }
  }
}
