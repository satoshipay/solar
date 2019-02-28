import React from "react"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { TransferFields } from "@satoshipay/sep-6"
import { HorizontalLayout } from "../Layout/Box"
import { formatDescriptionText, formatFieldDescription, formatIdentifier } from "./formatters"

interface FormBuilderFieldProps {
  descriptor: TransferFields[""]
  name: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
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
        style={{ flexGrow: 1 }}
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
        style={{ flexGrow: 1 }}
        value={props.value}
      />
    )
  }
}

interface Props {
  fields: TransferFields
  formValues: { [fieldName: string]: string }
  onSetFormValue: (fieldName: string, newValue: string) => void
}

function FormBuilder(props: Props) {
  // We had issues with illegal properties in the fields data
  const fields = Object.entries(props.fields).filter(
    ([fieldName, descriptor]) => descriptor && typeof descriptor === "object"
  )
  return (
    <HorizontalLayout margin="16px 0">
      {fields.map(([fieldName, descriptor]) => (
        <FormBuilderField
          key={fieldName}
          descriptor={descriptor}
          name={fieldName}
          onChange={event => props.onSetFormValue(fieldName, event.target.value)}
          value={props.formValues[fieldName]}
        />
      ))}
    </HorizontalLayout>
  )
}

export default FormBuilder
