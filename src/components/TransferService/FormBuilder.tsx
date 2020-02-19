import React from "react"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { TransferInfoFields } from "@satoshipay/stellar-transfer"
import { formatDescriptionText, formatIdentifier } from "./formatters"
import FormLayout from "./FormLayout"

interface FormBuilderFieldProps {
  autoFocus?: boolean
  descriptor: TransferInfoFields[""]
  name: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  style?: React.CSSProperties
  value?: string
}

export function FormBuilderField(props: FormBuilderFieldProps) {
  const { description, choices, optional = false } = props.descriptor

  const formattedDescription = formatDescriptionText(description)
  const formattedName = formatIdentifier(props.name)
  const placeholder = `${optional ? "(Optional) " : ""}${formattedName}`

  if (choices) {
    return (
      <TextField
        autoFocus={props.autoFocus}
        helperText={formattedDescription}
        label={formattedName}
        onChange={props.onChange}
        placeholder={placeholder}
        select
        style={{ flexGrow: 1, ...props.style }}
        value={props.value}
      >
        {choices.map((choice, index) => (
          <MenuItem key={index} value={choice}>
            {formatIdentifier(choice)}
          </MenuItem>
        ))}
      </TextField>
    )
  } else {
    return (
      <TextField
        autoFocus={props.autoFocus}
        helperText={formattedDescription}
        label={formattedName}
        onChange={props.onChange}
        placeholder={placeholder}
        style={{ flexGrow: 1, ...props.style }}
        value={props.value || ""}
      />
    )
  }
}

interface Props {
  fields: TransferInfoFields
  fieldStyle?: React.CSSProperties
  formValues: { [fieldName: string]: string }
  onSetFormValue: (fieldName: string, newValue: string) => void
  style?: React.CSSProperties
}

export function FormBuilder(props: Props) {
  // We had issues with illegal properties in the fields data
  const fields = Object.entries(props.fields).filter(
    ([fieldName, descriptor]) => descriptor && typeof descriptor === "object"
  )
  return (
    <FormLayout>
      {fields.map(([fieldName, descriptor]) => (
        <FormBuilderField
          key={fieldName}
          descriptor={descriptor}
          name={fieldName}
          onChange={event => props.onSetFormValue(fieldName, event.target.value)}
          style={props.fieldStyle}
          value={props.formValues[fieldName]}
        />
      ))}
    </FormLayout>
  )
}
