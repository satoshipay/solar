import React from "react"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"

export function PriceInput(props: TextFieldProps & { assetCode: string }) {
  return (
    <TextField
      {...props}
      InputProps={{
        endAdornment: (
          <InputAdornment disableTypography position="end" style={{ pointerEvents: "none" }}>
            {props.assetCode}
          </InputAdornment>
        ),
        ...props.InputProps
      }}
    />
  )
}

export function ReadOnlyTextfield(props: TextFieldProps) {
  return (
    <TextField
      {...props}
      style={{
        pointerEvents: "none",
        ...props.style
      }}
      tabIndex={-1}
      InputProps={{
        readOnly: true,
        ...props.InputProps
      }}
    />
  )
}
