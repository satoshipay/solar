import React from "react"
import { useTranslation } from "react-i18next"
import Async from "react-promise"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import { CloseButton, DialogActionsBox } from "../Dialog/Generic"
import ErrorIcon from "../Icon/Error"
import SuccessIcon from "../Icon/Success"
import { Box, VerticalLayout } from "../Layout/Box"
import { explainSubmissionErrorResponse } from "../../lib/horizonErrors"

function Container(props: { children: React.ReactNode }) {
  return (
    <Box width="250px" maxWidth="40vw" height="100%">
      <VerticalLayout padding={10} height="100%" alignItems="center" justifyContent="center">
        {props.children}
      </VerticalLayout>
    </Box>
  )
}

function Heading(props: { children: React.ReactNode }) {
  return (
    <Typography align="center" variant="subtitle1">
      {props.children}
    </Typography>
  )
}

export enum SubmissionType {
  default,
  multisig,
  stellarguard
}

const successMessages: { [type: number]: string } = {
  [SubmissionType.default]: "Successful",
  [SubmissionType.multisig]: "Waiting for missing signatures",
  [SubmissionType.stellarguard]: "Waiting for StellarGuard authorization"
}

interface SubmissionProgressProps {
  onClose?: () => void
  promise: Promise<any>
  type: SubmissionType
}

function SubmissionProgress(props: SubmissionProgressProps) {
  const { t } = useTranslation()
  return (
    <Async
      promise={props.promise}
      pending={
        <Container>
          <CircularProgress size={70} style={{ marginBottom: 24 }} />
          <Heading>Submitting to network...</Heading>
        </Container>
      }
      then={() => (
        <Container>
          <SuccessIcon size={100} />
          <Heading>{successMessages[props.type]}</Heading>
        </Container>
      )}
      catch={error => (
        <Container>
          <ErrorIcon size={100} />
          <Heading>{explainSubmissionErrorResponse(error.response, t).message || JSON.stringify(error)}</Heading>
          <DialogActionsBox>
            <CloseButton onClick={props.onClose} />
          </DialogActionsBox>
        </Container>
      )}
    />
  )
}

export default SubmissionProgress
