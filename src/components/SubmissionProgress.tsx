import React from "react"
import Async from "react-promise"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import ErrorIcon from "./Icon/Error"
import SuccessIcon from "./Icon/Success"
import { AspectRatioBox, VerticalLayout } from "./Layout/Box"

const FloatingStatusBox = (props: { children: React.ReactNode }) => {
  return (
    <AspectRatioBox width="200px" maxWidth="40vw" ratio="3:2">
      <VerticalLayout padding={10} height="100%" justifyContent="center">
        <Typography align="center" variant="subheading">
          {props.children}
        </Typography>
      </VerticalLayout>
    </AspectRatioBox>
  )
}

const SubmissionProgress = (props: { promise: Promise<any> }) => (
  <Async
    promise={props.promise}
    pending={
      <FloatingStatusBox>
        <CircularProgress
          size={70}
          style={{ marginTop: 10, marginBottom: 20 }}
        />
        <div>Sending transaction...</div>
      </FloatingStatusBox>
    }
    then={() => (
      <FloatingStatusBox>
        <SuccessIcon size={100} />
        <div>Transaction successful</div>
      </FloatingStatusBox>
    )}
    catch={error => (
      <FloatingStatusBox>
        <ErrorIcon size={100} />
        <div>Transaction failed: {error.message || JSON.stringify(error)}</div>
      </FloatingStatusBox>
    )}
  />
)

export default SubmissionProgress
