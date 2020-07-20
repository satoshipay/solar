import React from "react"
import Button from "@material-ui/core/Button"
import { storiesOf } from "@storybook/react"
import ErrorBoundary from "../components/ErrorBoundaryView"
import { VerticalLayout } from "~Layout/components/Box"

function Failing() {
  const [failing, setFailing] = React.useState(false)
  const fail = React.useCallback(() => setFailing(true), [])
  if (failing) {
    throw new Error("Exception time!")
  }
  return (
    <VerticalLayout alignItems="center" justifyContent="center">
      <Button onClick={fail} variant="contained">
        Throw
      </Button>
    </VerticalLayout>
  )
}

storiesOf("ErrorBoundary", module).add("ErrorBoundary", () => (
  <VerticalLayout height="400px" justifyContent="center">
    <ErrorBoundary>
      <Failing />
    </ErrorBoundary>
  </VerticalLayout>
))
