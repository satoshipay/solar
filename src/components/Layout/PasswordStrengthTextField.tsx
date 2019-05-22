import React from "react"
import zxcvbn, { ZXCVBNResult } from "zxcvbn"
import { TextField, PropTypes } from "@material-ui/core"
import "./PasswordStrengthTextField.css"
import { FilledInputProps } from "@material-ui/core/FilledInput"

const PasswordStrengthIndicator = (props: { password: string }) => {
  const { password } = props
  const strengthResult = zxcvbn(password)

  const createPasswordLabel = (result: ZXCVBNResult) => {
    switch (result.score) {
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

  return (
    <div className="password-strength-meter">
      <progress
        className={`password-strength-meter-progress strength-${createPasswordLabel(strengthResult)}`}
        value={strengthResult.score}
        max="4"
      />
      <br />
      <label className="password-strength-meter-label">
        {password && (
          <>
            <strong>Password strength:</strong> {createPasswordLabel(strengthResult)}
          </>
        )}
      </label>
    </div>
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
  value: string
}

const PasswordStrengthTextField = (props: PasswordStrengthTextFieldProps) => {
  return (
    <div style={props.style}>
      <TextField
        disabled={props.disabled}
        error={props.error}
        fullWidth={props.fullWidth}
        label={props.label}
        placeholder={props.placeholder}
        margin={props.margin}
        onChange={props.onChange}
        value={props.value}
        InputProps={props.InputProps}
        type="password"
      />
      <PasswordStrengthIndicator password={props.value} />
    </div>
  )
}

export default PasswordStrengthTextField
