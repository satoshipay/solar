import React from "react"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"

export function PriceInput(props: TextFieldProps & { assetCode: string; readOnly?: boolean }) {
  const { assetCode, readOnly, ...textfieldProps } = props
  return (
    <TextField
      {...textfieldProps}
      InputProps={{
        endAdornment: (
          <InputAdornment disableTypography position="end" style={{ pointerEvents: "none" }}>
            {assetCode}
          </InputAdornment>
        ),
        readOnly,
        ...textfieldProps.InputProps
      }}
      style={{
        pointerEvents: props.readOnly ? "none" : undefined,
        ...textfieldProps.style
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
