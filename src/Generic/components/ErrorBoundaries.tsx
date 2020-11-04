import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { fade, useTheme } from "@material-ui/core/styles"
import ErrorIcon from "@material-ui/icons/Error"
import React from "react"
import { Translation, useTranslation } from "react-i18next"
import { Box, HorizontalLayout, VerticalLayout } from "~Layout/components/Box"
import { getErrorTranslation } from "../lib/errors"

// tslint:disable-next-line
const pkg = require("../../../package.json")

const buttonLabels = ["Oh no", "Drats!", "Nevermind", "Let's try this again", "Not my day"]

interface State {
  error: Error | null
}

function ErrorBoundary<Props extends { children: React.ReactNode }>(
  View: React.FunctionComponent<Props & { error: Error }>
): React.ComponentType<Props> {
  return class ErrorComponent extends React.PureComponent<Props, State> {
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

    render() {
      const { error } = this.state

      if (error) {
        return <View {...this.props} error={error} />
      } else {
        return <>{this.props.children}</>
      }
    }
  }
}

export const HideOnError = ErrorBoundary(function HideOnError() {
  return <React.Fragment />
})

interface InlineErrorBoundaryProps {
  children: React.ReactNode
  height?: React.CSSProperties["height"]
}

export const InlineErrorBoundary = ErrorBoundary<InlineErrorBoundaryProps>(function InlineErrorBoundary(props) {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <HorizontalLayout
      alignItems="center"
      height={props.height}
      style={{
        background: fade(theme.palette.error.main, 0.2),
        borderRadius: 8,
        color: theme.palette.error.main,
        fontWeight: 600,
        padding: "8px 12px"
      }}
    >
      <ErrorIcon />
      <span style={{ marginLeft: 8 }}>{getErrorTranslation(props.error, t)}</span>
    </HorizontalLayout>
  )
})

interface MainErrorBoundaryProps {
  children: React.ReactNode
}

export const MainErrorBoundary = ErrorBoundary<MainErrorBoundaryProps>(function MainErrorBoundary(props) {
  const refreshContent = React.useCallback(() => window.location.reload(), [])
  return (
    <VerticalLayout alignItems="center" grow height="100%" justifyContent="center" padding="40px" position="relative">
      <Translation>
        {t => (
          <>
            <Box textAlign="center">
              <Typography variant="h5">{t("generic.error.boundary.header")}</Typography>
              <Typography style={{ margin: "8px 0 24px", userSelect: "text" }} variant="body2">
                {getErrorTranslation(props.error, t)}
              </Typography>
              <Button color="primary" onClick={refreshContent} variant="contained">
                {buttonLabels[Math.floor(Math.random() * buttonLabels.length)]}
              </Button>
            </Box>
            <Box style={{ position: "absolute", bottom: 8, left: 0, width: "100%", opacity: 0.5 }}>
              <Typography align="center" color="textPrimary">
                {t("generic.error.boundary.contact-us")}{" "}
                <a
                  href="mailto:hello@solarwallet.io"
                  style={{ color: "inherit" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  hello@solarwallet.io
                </a>
              </Typography>
              <Typography align="center" color="textPrimary">
                v{pkg.version}
              </Typography>
            </Box>
          </>
        )}
      </Translation>
    </VerticalLayout>
  )
})
