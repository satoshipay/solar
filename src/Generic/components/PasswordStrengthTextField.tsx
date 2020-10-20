import React from "react"
import zxcvbn, { ZXCVBNScore } from "zxcvbn"
import makeStyles from "@material-ui/styles/makeStyles"
import PasswordField from "~Generic/components/PasswordField"
import { StandardTextFieldProps } from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"

function getColor(passwordStrength: number) {
  switch (passwordStrength) {
    case 0:
      return "#f0a8a8"
    case 1:
      return "#f0c6a8"
    case 2:
      return "#f0e7a8"
    case 3:
      return "#caf0a8"
    case 4:
      return "#a8f0c2"
    default:
      return "#ffffff"
  }
}

function getLabel(passwordStrength: number) {
  switch (passwordStrength) {
    case 0:
      return "Very Weak"
    case 1:
      return "Weak"
    case 2:
      return "Fair"
    case 3:
      return "Good"
    case 4:
      return "Strong"
    default:
      return "Weak"
  }
}

const useProgressBarStyles = makeStyles({
  barContainer: {
    height: "1em",
    marginTop: -15,
    position: "relative",
    width: "100%"
  },
  barProgress: {
    borderRadius: 4,
    display: "inline-block",
    width: "100%",
    height: 3,

    "&:before": {
      position: "absolute",
      content: "attr(data-label)",
      fontSize: "0.8em",
      textAlign: "center",
      top: " -2px",
      left: 0,
      right: 0
    }
  }
})

interface ProgressBarProps {
  color: string
  progress: number
}

function ProgressBar(props: ProgressBarProps) {
  const classes = useProgressBarStyles()

  return (
    <div className={classes.barContainer}>
      <span
        className={classes.barProgress}
        style={{
          backgroundColor: props.color,
          width: `${props.progress}%`
        }}
      />
    </div>
  )
}

function PasswordStrengthBar(props: { password: string; passwordStrength: ZXCVBNScore }) {
  const { password, passwordStrength } = props

  const [color, setColor] = React.useState("#ffffff")
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    setProgress((passwordStrength + 1) * 20)

    setColor(getColor(passwordStrength))
  }, [passwordStrength])

  return password.length > 0 ? <ProgressBar color={color} progress={progress} /> : <></>
}

interface PasswordStrengthLabelProps {
  className: string | undefined
  passwordStrength: ZXCVBNScore
  style?: React.CSSProperties
  visible: boolean
}

function PasswordStrengthLabel(props: PasswordStrengthLabelProps) {
  const { className, passwordStrength, style, visible } = props
  const [label, setLabel] = React.useState("")

  React.useEffect(() => {
    setLabel(getLabel(passwordStrength))
  }, [passwordStrength])

  return visible ? (
    <Typography align="center" className={className} style={style}>
      {label}
    </Typography>
  ) : (
    <></>
  )
}

const usePasswordStrengthTextFieldStyles = makeStyles({
  container: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid rgba(0, 0, 0, 0.42)"
  },
  containerFocused: {
    display: "flex",
    alignItems: "center",
    borderBottom: "2px solid #0290c0"
  },
  passwordField: {
    flexGrow: 5
  },
  passwordLabel: {
    marginTop: 10,
    flexBasis: "10%"
  }
})

interface PasswordStrengthTextFieldProps extends StandardTextFieldProps {
  value: string
}

function PasswordStrengthTextField(props: PasswordStrengthTextFieldProps) {
  const classes = usePasswordStrengthTextFieldStyles()

  const [focused, setFocused] = React.useState(false)
  const [passwordStrength, setPasswordStrength] = React.useState<ZXCVBNScore>(0)

  React.useEffect(() => {
    const strengthResult = zxcvbn(props.value)
    setPasswordStrength(strengthResult.score)
  }, [props.value])

  return (
    <>
      <div className={focused ? classes.containerFocused : classes.container}>
        <PasswordField
          {...props}
          className={classes.passwordField}
          InputProps={{ ...props.InputProps, disableUnderline: true }}
          onFocus={event => {
            if (props.onFocus) {
              props.onFocus(event)
            }
            setFocused(true)
          }}
          onBlur={event => {
            if (props.onBlur) {
              props.onBlur(event)
            }

            setFocused(false)
          }}
        />
        <PasswordStrengthLabel
          className={classes.passwordLabel}
          passwordStrength={passwordStrength}
          visible={Boolean(props.value)}
        />
      </div>
      <PasswordStrengthBar password={props.value} passwordStrength={passwordStrength} />
    </>
  )
}

export default PasswordStrengthTextField
