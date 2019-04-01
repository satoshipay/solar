import React from "react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { Box, VerticalLayout } from "./Layout/Box"

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
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state

    if (error) {
      return (
        <VerticalLayout alignItems="center" height="100%" justifyContent="center" padding="40px">
          <Box textAlign="center">
            <Typography variant="h5">Oops, something went wrong...</Typography>
            <Typography style={{ margin: "8px 0 24px" }} variant="body2">
              {error.message || error}
            </Typography>
            <Button color="primary" onClick={this.reload} variant="contained">
              Reload
            </Button>
          </Box>
        </VerticalLayout>
      )
    } else {
      return <>{this.props.children}</>
    }
  }
}
