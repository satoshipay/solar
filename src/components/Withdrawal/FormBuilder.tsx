import React from "react"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { TransferFields } from "@satoshipay/stellar-sep-6"
import { HorizontalLayout } from "../Layout/Box"
import { formatDescriptionText, formatIdentifier } from "./formatters"

interface FormBuilderFieldProps {
  descriptor: TransferFields[""]
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
        helperText={formattedDescription}
        label={formattedName}
        onChange={props.onChange}
        placeholder={placeholder}
        select
        style={{ flexGrow: 1, ...props.style }}
        value={props.value}
      >
        {choices.map(choice => (
          <MenuItem value={choice}>{formatIdentifier(choice)}</MenuItem>
        ))}
      </TextField>
    )
  } else {
    return (
      <TextField
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
  fields: TransferFields
  fieldStyle?: React.CSSProperties
  formValues: { [fieldName: string]: string }
  onSetFormValue: (fieldName: string, newValue: string) => void
  style?: React.CSSProperties
}

function FormBuilder(props: Props) {
  // We had issues with illegal properties in the fields data
  const fields = Object.entries(props.fields).filter(
    ([fieldName, descriptor]) => descriptor && typeof descriptor === "object"
  )
  return (
    <HorizontalLayout margin="0 -12px" wrap="wrap" style={props.style}>
      {fields.map(([fieldName, descriptor]) => (
        <FormBuilderField
          key={fieldName}
          descriptor={descriptor}
          name={fieldName}
          onChange={event => props.onSetFormValue(fieldName, event.target.value)}
          style={{ marginLeft: 12, marginRight: 12, minWidth: "40%", ...props.fieldStyle }}
          value={props.formValues[fieldName]}
        />
      ))}
    </HorizontalLayout>
  )
}

export default FormBuilder
