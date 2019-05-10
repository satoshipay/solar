import React from "react"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { TransferFields } from "@satoshipay/stellar-sep-6"
import { HorizontalLayout } from "../Layout/Box"
import { formatFieldDescription, formatIdentifier } from "./formatters"

interface FormBuilderFieldProps {
  descriptor: TransferFields[""]
  name: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  style?: React.CSSProperties
  value?: string
}

function FormBuilderField(props: FormBuilderFieldProps) {
  const { description, choices, optional = false } = props.descriptor

  if (choices) {
    return (
      <TextField
        label={formatIdentifier(props.name)}
        onChange={props.onChange}
        placeholder={formatFieldDescription(description, optional)}
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
        label={formatIdentifier(props.name)}
        onChange={props.onChange}
        placeholder={formatFieldDescription(description, optional)}
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
}

function FormBuilder(props: Props) {
  // We had issues with illegal properties in the fields data
  const fields = Object.entries(props.fields).filter(
    ([fieldName, descriptor]) => descriptor && typeof descriptor === "object"
  )
  return (
    <HorizontalLayout margin="0 -12px" wrap="wrap">
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
