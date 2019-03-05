import React from "react"
import Async from "react-promise"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import ErrorIcon from "./Icon/Error"
import SuccessIcon from "./Icon/Success"
import { AspectRatioBox, VerticalLayout } from "./Layout/Box"
import { explainSubmissionError } from "../lib/horizonErrors"

const Container = (props: { children: React.ReactNode }) => {
  return (
    <AspectRatioBox width="250px" maxWidth="40vw" ratio="3:2">
      <VerticalLayout padding={10} height="100%" alignItems="center" justifyContent="center">
        {props.children}
      </VerticalLayout>
    </AspectRatioBox>
  )
}

const Heading = (props: { children: React.ReactNode }) => {
  return (
    <Typography align="center" variant="subtitle1">
      {props.children}
    </Typography>
  )
}

const SubmissionProgress = (props: { promise: Promise<any> }) => (
  <Async
    promise={props.promise}
    pending={
      <Container>
        <CircularProgress size={70} style={{ marginTop: 10, marginBottom: 20 }} />
        <Heading>Submitting to network...</Heading>
      </Container>
    }
    then={() => (
      <Container>
        <SuccessIcon size={100} />
        <Heading>Successful</Heading>
      </Container>
    )}
    catch={error => (
      <Container>
        <ErrorIcon size={100} />
        <Heading>{explainSubmissionError(error).message || JSON.stringify(error)}</Heading>
      </Container>
    )}
  />
)

export default SubmissionProgress
