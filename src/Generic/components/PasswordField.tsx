import React from "react"
import IconButton from "@material-ui/core/IconButton"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"
import Visibility from "@material-ui/icons/Visibility"
import VisibilityOff from "@material-ui/icons/VisibilityOff"

function PasswordField(props: Omit<TextFieldProps, "type">) {
  const [showPassword, setShowPassword] = React.useState(false)

  const handleClickShowPassword = React.useCallback(() => {
    setShowPassword(!showPassword)
  }, [showPassword])

  return (
    <TextField
      {...props}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={handleClickShowPassword}>
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )
      }}
      type={showPassword ? "text" : "password"}
    />
  )
}

export default PasswordField
