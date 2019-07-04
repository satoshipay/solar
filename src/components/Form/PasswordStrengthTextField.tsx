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
    height: "1.2em",
    textTransform: "uppercase",

    "&:before": {
      position: "absolute",
      content: "attr(data-label)",
      fontSize: "0.8em",
      lineHeight: "1.6em",
      textAlign: "center",
      left: 0,
      right: 0
    }
  }
}

interface ProgressBarProps {
  classes: ClassNameMap<keyof typeof progressBarStyles>
  background: string
  color?: string
  label: string
  progress: string
}

const ProgressBar = withStyles(progressBarStyles)((props: ProgressBarProps) => {
  return (
    <div
      style={{
        position: "relative",
        height: "1.2em",
        width: "100%"
      }}
    >
      <span
        data-label={props.label}
        className={props.classes.passwordStrengthMeterProgress}
        style={{
          backgroundColor: props.background,
          color: props.color,
          width: `${props.progress}`
        }}
      />
    </div>
  )
})

function PasswordStrengthIndicator(props: { password: string; passwordStrength: ZXCVBNScore }) {
  const { password, passwordStrength } = props

  if (!password) {
    return <div style={{ height: "1.2em" }} />
  } else if (passwordStrength >= 4) {
    return <ProgressBar background="#00b341" color="white" label="Strong" progress="100%" />
  } else if (passwordStrength === 3) {
    return <ProgressBar background="#66b300" color="white" label="Good" progress="80%" />
  } else if (passwordStrength === 2) {
    return <ProgressBar background="#b39b00" color="white" label="Fair" progress="60%" />
  } else if (passwordStrength === 1) {
    return <ProgressBar background="#b34a00" label="Weak" progress="40%" />
  } else {
    return <ProgressBar background="#b30000" label="Poor" progress="20%" />
  }
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
