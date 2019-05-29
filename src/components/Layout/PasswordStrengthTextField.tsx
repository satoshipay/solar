import React from "react"
import { ZXCVBNScore } from "zxcvbn"
import { TextField, PropTypes, withStyles } from "@material-ui/core"
import { FilledInputProps } from "@material-ui/core/FilledInput"
import { StyleRules, ClassNameMap } from "@material-ui/core/styles/withStyles"

const progressBarStyles: StyleRules = {
  passwordStrengthMeterProgress: {
    borderRadius: 4,
    display: "inline-block",
    width: "100%",
    height: "1em",
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
}

interface ProgressBarProps {
  classes: ClassNameMap<keyof typeof progressBarStyles>
  color: string
  label: string
  progress: number
}

const ProgressBar = withStyles(progressBarStyles)((props: ProgressBarProps) => {
  return (
    <div
      style={{
        position: "relative",
        height: "1em",
        width: "100%"
      }}
    >
      <span
        data-label={props.label}
        className={props.classes.passwordStrengthMeterProgress}
        style={{
          backgroundColor: props.color,
          width: `${props.progress}%`
        }}
      />
    </div>
  )
})

function PasswordStrengthIndicator(props: { password: string; passwordStrength: ZXCVBNScore }) {
  const { password, passwordStrength } = props

  const calculateProgress = () => {
    return (passwordStrength + 1) * 20
  }

  const getColor = () => {
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

  const getLabel = () => {
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

  return password.length > 0 ? (
    <ProgressBar color={getColor()} label={getLabel()} progress={calculateProgress()} />
  ) : (
    <div />
  )
}

interface PasswordStrengthTextFieldProps {
  disabled?: boolean
  error?: boolean
  fullWidth?: boolean
  InputProps?: Partial<FilledInputProps>
  label?: React.ReactNode
  margin?: PropTypes.Margin
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  placeholder?: string
  style?: React.CSSProperties
  passwordStrength: ZXCVBNScore
  value: string
}

function PasswordStrengthTextField(props: PasswordStrengthTextFieldProps) {
  const { style, passwordStrength, ...textfieldProps } = props
  return (
    <div style={style}>
      <TextField {...textfieldProps} type="password" />
      <PasswordStrengthIndicator password={props.value} passwordStrength={passwordStrength} />
    </div>
  )
}

export default PasswordStrengthTextField
