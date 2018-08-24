import React from "react"
import Button from "@material-ui/core/Button"
import FormControl from "@material-ui/core/FormControl"
import InputLabel from "@material-ui/core/InputLabel"
import MenuItem from "@material-ui/core/MenuItem"
import Select from "@material-ui/core/Select"
import TextField from "@material-ui/core/TextField"
import SendIcon from "react-icons/lib/md/send"
import { Box, HorizontalLayout } from "../Layout/Box"
import { renderError } from "../../lib/formHandling"

export interface PaymentCreationValues {
  amount: string
  destination: string
  memoType: "id" | "none" | "text"
  memoValue: string
}

type PaymentCreationErrors = { [fieldName in keyof PaymentCreationValues]?: Error | null }

function validateFormValues(formValues: PaymentCreationValues) {
  const errors: PaymentCreationErrors = {}

  if (!formValues.destination.match(/^G[A-Z0-9]{55}$/)) {
    errors.destination = new Error(`Invalid stellar public key.`)
  }
  if (!formValues.amount.match(/^[0-9]+(\.[0-9]+)?$/)) {
    errors.amount = new Error("Invalid number.")
  }
  // TODO: Check that amount <= balance

  if (formValues.memoType === "text") {
    if (formValues.memoValue.length === 0) {
      errors.memoValue = new Error('Memo cannot be empty, but can set memo type to "None".')
    } else if (formValues.memoValue.length > 28) {
      errors.memoValue = new Error("Memo too long.")
    }
  } else if (formValues.memoType === "id") {
    if (!formValues.memoValue.match(/^[0-9]+$/)) {
      errors.memoValue = new Error("Memo must be an integer.")
    }
  }

  const success = Object.keys(errors).length === 0
  return { errors, success }
}

interface PaymentCreationFormProps {
  errors: PaymentCreationErrors
  formValues: PaymentCreationValues
  setFormValue: (fieldName: keyof PaymentCreationValues, value: string) => void
  onSubmit: () => void
}

const PaymentCreationForm = (props: PaymentCreationFormProps) => {
  const { errors, formValues, setFormValue, onSubmit } = props

  const memoPlaceholders: { [memoType in PaymentCreationValues["memoType"]]: string } = {
    id: "Integer identifier",
    none: "",
    text: "Memo"
  }
  const handleSubmitEvent = (event: React.SyntheticEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmitEvent}>
      <TextField
        error={Boolean(errors.destination)}
        label={errors.destination ? renderError(errors.destination) : "Destination address"}
        placeholder="GABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS"
        fullWidth
        autoFocus
        margin="dense"
        value={formValues.destination}
        onChange={event => setFormValue("destination", event.target.value)}
      />
      <HorizontalLayout justifyContent="space-between" alignItems="center">
        <TextField
          error={Boolean(errors.amount)}
          label={errors.amount ? renderError(errors.amount) : "Amount"}
          margin="dense"
          value={formValues.amount}
          onChange={event => setFormValue("amount", event.target.value)}
          InputProps={{
            endAdornment: <span style={{ alignSelf: "center" }}>XLM</span>
          }}
          style={{
            minWidth: "30%"
          }}
        />
        <FormControl style={{ width: "30%" }}>
          <InputLabel htmlFor="select-memo-type">Memo type</InputLabel>
          <Select
            inputProps={{ id: "select-memo-type" }}
            onChange={event => setFormValue("memoType", event.target.value)}
            value={formValues.memoType}
            style={{ width: "100%" }}
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="id">ID</MenuItem>
          </Select>
        </FormControl>
      </HorizontalLayout>
      <Box>
        {formValues.memoType !== "none" ? (
          <TextField
            error={Boolean(errors.memoValue)}
            label={errors.memoValue ? renderError(errors.memoValue) : memoPlaceholders[formValues.memoType]}
            margin="dense"
            onChange={event => setFormValue("memoValue", event.target.value)}
            value={formValues.memoValue}
            inputProps={{
              maxLength: 28
            }}
            style={{ width: "70%" }}
          />
        ) : (
          <div />
        )}
      </Box>
      <Box margin="64px 0 0">
        <Button variant="contained" color="primary" onClick={handleSubmitEvent} type="submit">
          <SendIcon style={{ marginRight: 8 }} />
          Create Payment
        </Button>
      </Box>
    </form>
  )
}

interface Props {
  onSubmit?: (formValues: PaymentCreationValues) => any
}

interface State {
  errors: PaymentCreationErrors
  formValues: PaymentCreationValues
}

class StatefulPaymentCreationForm extends React.Component<Props, State> {
  state: State = {
    errors: {},
    formValues: {
      amount: "",
      destination: "",
      memoType: "none",
      memoValue: ""
    }
  }

  setFormValue = (fieldName: keyof PaymentCreationValues, value: string | null) => {
    this.setState({
      formValues: {
        ...this.state.formValues,
        [fieldName]: value
      }
    })
  }

  submit = () => {
    const { onSubmit = () => undefined } = this.props

    const { errors, success } = validateFormValues(this.state.formValues)
    this.setState({ errors })

    if (success) {
      onSubmit(this.state.formValues)
    }
  }

  render() {
    return (
      <PaymentCreationForm {...this.props} {...this.state} onSubmit={this.submit} setFormValue={this.setFormValue} />
    )
  }
}

export default StatefulPaymentCreationForm
