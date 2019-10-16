import React from "react"
import Typography from "@material-ui/core/Typography"
import IconButton from "@material-ui/core/IconButton"
import CloseIcon from "@material-ui/icons/Close"
import ArrowRight from "@material-ui/icons/ArrowRight"
import ArrowLeft from "@material-ui/icons/ArrowLeft"
import { Box, VerticalLayout, HorizontalLayout } from "../Layout/Box"
import { DialogActionsBox, ActionButton } from "../Dialog/Generic"
import DialogBody from "../Dialog/DialogBody"
import { useIsMobile } from "../../hooks/userinterface"

interface OnboardingDialogProps {
  onClose: () => void
}

interface OnboardingStepInfo {
  action: string
  description: string
  img: any
  subtitle?: string
  title: string
}

const onboardingSteps: OnboardingStepInfo[] = [
  {
    action: "Next",
    description:
      "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,",
    img: require("../../../static/pig-closed.png"),
    title: "Step 1"
  },
  {
    action: "Create account",
    description:
      "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren,",
    img: require("../../../static/pig-open.png"),
    title: "Step 2"
  }
]

function OnboardingDialog(props: OnboardingDialogProps) {
  const isSmallScreen = useIsMobile()
  const [step, setStep] = React.useState<number>(0)

  const currentStepInfo = React.useMemo(() => onboardingSteps[step], [step])

  const headerContent = (
    <VerticalLayout>
      <HorizontalLayout alignItems="center">
        <Typography
          variant="h5"
          color="textPrimary"
          style={{
            fontSize: isSmallScreen ? 20 : 24,
            minWidth: "40%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {currentStepInfo.title}
        </Typography>
        <Box grow style={{ textAlign: "right" }}>
          <IconButton onClick={props.onClose} style={{ color: "inherit" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </HorizontalLayout>
      {currentStepInfo.subtitle ? (
        <Typography variant="subtitle1" color="textSecondary">
          {currentStepInfo.subtitle}
        </Typography>
      ) : (
        undefined
      )}
    </VerticalLayout>
  )

  const onNextActionClick = () => {
    if (step === onboardingSteps.length - 1) {
      // TODO navigate to a different view
    } else {
      setStep(step + 1)
    }
  }

  const actions = React.useMemo(
    () => (
      <>
        {step > 0 ? (
          <ActionButton icon={<ArrowLeft />} onClick={() => setStep(step - 1)} type="secondary">
            Back
          </ActionButton>
        ) : (
          undefined
        )}
        <ActionButton icon={<ArrowRight />} iconLast onClick={onNextActionClick} type="primary">
          {currentStepInfo.action}
        </ActionButton>
      </>
    ),
    [step, currentStepInfo]
  )

  const description = React.useMemo(
    () => (
      <Typography variant="body1" color="textPrimary" style={{ flex: "1 1 0" }}>
        {currentStepInfo.description}
      </Typography>
    ),
    [currentStepInfo]
  )

  const picture = React.useMemo(
    () => (
      <Box padding="8px" display="flex" justifyContent="center" style={{ flex: "1 1 0" }}>
        <img src={currentStepInfo.img} alt="Crypto-Pig" />
      </Box>
    ),
    [currentStepInfo]
  )

  return (
    <DialogBody top={headerContent} actions={<DialogActionsBox smallDialog>{actions}</DialogActionsBox>}>
      <VerticalLayout padding="16px 16px">
        <HorizontalLayout display="flex" alignItems="center">
          {description}
          {picture}
        </HorizontalLayout>
      </VerticalLayout>
    </DialogBody>
  )
}

export default OnboardingDialog
