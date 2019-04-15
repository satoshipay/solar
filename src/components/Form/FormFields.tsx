import React from "react"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField, { TextFieldProps } from "@material-ui/core/TextField"

type PriceInputProps = TextFieldProps & { assetCode: React.ReactNode; readOnly?: boolean }

// tslint:disable-next-line no-shadowed-variable
export const PriceInput = React.memo(function PriceInput(props: PriceInputProps) {
  const { assetCode, readOnly, ...textfieldProps } = props
  return (
    <TextField
      {...textfieldProps}
      InputProps={{
        endAdornment: (
          <InputAdornment
            disableTypography
            position="end"
            style={{ pointerEvents: typeof assetCode === "string" ? "none" : undefined }}
          >
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
})

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
