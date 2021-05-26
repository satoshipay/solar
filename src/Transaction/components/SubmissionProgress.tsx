import React from "react"
import { useTranslation } from "react-i18next"
import Async from "react-promise"
import CircularProgress from "@material-ui/core/CircularProgress"
import Typography from "@material-ui/core/Typography"
import { ActionButton, CloseButton, DialogActionsBox } from "~Generic/components/DialogActions"
import ErrorIcon from "~Icons/components/Error"
import RetryIcon from "@material-ui/icons/Replay"
import SuccessIcon from "~Icons/components/Success"
import { Box, VerticalLayout } from "~Layout/components/Box"
import { explainSubmissionErrorResponse } from "~Generic/lib/horizonErrors"
import { getErrorTranslation } from "~Generic/lib/errors"
import { useIsMobile } from "~Generic/hooks/userinterface"

function Container(props: { children: React.ReactNode }) {
  const isSmallScreen = useIsMobile()
  return (
    <Box width="100%" maxWidth={isSmallScreen ? undefined : "40vw"} height="100%">
      <VerticalLayout padding={10} height="100%" alignItems="center" justifyContent="center">
        {props.children}
      </VerticalLayout>
    </Box>
  )
}

function Heading(props: { children: React.ReactNode }) {
  return (
    <Typography align="center" variant="subtitle1" style={{ wordBreak: "break-word" }}>
      {props.children}
    </Typography>
  )
}

export enum SubmissionType {
  default,
  multisig,
  thirdParty
}

const successMessages: { [type: number]: string } = {
  [SubmissionType.default]: "generic.submission-progress.success.default",
  [SubmissionType.multisig]: "generic.submission-progress.success.multisig",
  [SubmissionType.thirdParty]: "generic.submission-progress.success.third-party"
}

interface SubmissionProgressProps {
  onClose?: () => void
  onRetry?: () => Promise<void>
  promise: Promise<any>
  type: SubmissionType
}

function SubmissionProgress(props: SubmissionProgressProps) {
  const { onRetry } = props
  const { t } = useTranslation()

  const [loading, setLoading] = React.useState(false)

  const retry = React.useCallback(() => {
    if (onRetry) {
      setLoading(true)
      onRetry().finally(() => setLoading(false))
    }
  }, [onRetry, setLoading])

  return (
    <Async
      promise={props.promise}
      pending={
        <Container>
          <CircularProgress size={70} style={{ marginBottom: 24 }} />
          <Heading>{t("generic.submission-progress.pending")}</Heading>
        </Container>
      }
      then={() => (
        <Container>
          <SuccessIcon size={100} />
          <Heading>{t(successMessages[props.type])}</Heading>
        </Container>
      )}
      catch={error => (
        <Container>
          <ErrorIcon size={100} />
          <Heading>
            {error.response
              ? explainSubmissionErrorResponse(error.response, t).message || JSON.stringify(error)
              : getErrorTranslation(error, t)}
          </Heading>
          <DialogActionsBox>
            {props.onRetry && (
              <ActionButton icon={<RetryIcon />} loading={loading} onClick={retry} type="primary">
                {t("generic.dialog-actions.retry.label")}
              </ActionButton>
            )}
            <CloseButton onClick={props.onClose} />
          </DialogActionsBox>
        </Container>
      )}
    />
  )
}

export default SubmissionProgress
