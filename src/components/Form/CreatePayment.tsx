import React from "react"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import SendIcon from "react-icons/lib/md/send"
import { Box, HorizontalLayout } from "../Layout/Box"
import { addFormState, renderError, InnerFormProps } from "../../lib/formHandling"

export interface PaymentCreationValues {
  amount: string
  destination: string
}

type PaymentCreationErrors = { [fieldName in keyof PaymentCreationValues]?: Error | null }

function validateFormValues(formValues: PaymentCreationValues) {
  const errors: PaymentCreationErrors = {}

  if (!formValues.destination.match(/^G[A-Z0-9]{55}$/)) {
    errors.destination = new Error(`Invalid stellar public key.`)
  }
  if (!formValues.amount.match(/^[0-9]+(\.[0-9]+)?$/)) {
    errors.amount = new Error(`Invalid number.`)
  }
  // TODO: Check that amount <= balance

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
      <HorizontalLayout>
        <Box shrink>
          <TextField
            error={Boolean(errors.amount)}
            label={errors.amount ? renderError(errors.amount) : "Amount"}
            fullWidth
            margin="dense"
            value={formValues.amount}
            onChange={event => setFormValue("amount", event.target.value)}
          />
        </Box>
        <Box fixed alignSelf="flex-end" padding="0 0 12px" margin="0 0 0 8px">
          XLM
        </Box>
      </HorizontalLayout>
      <Box margin="32px 0 0">
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
  state = {
    errors: {},
    formValues: {
      amount: "",
      destination: ""
    }
  }

  handleSubmit = () => {
    const { onSubmit = () => undefined } = this.props

    const { errors, success } = validateFormValues(this.state.formValues)
    this.setState({ errors })

    if (success) {
      onSubmit(this.state.formValues)
    }
  }

  setFormValue = (fieldName: keyof PaymentCreationValues, value: string) => {
    this.setState({
      formValues: {
        ...this.state.formValues,
        [fieldName]: value
      }
    })
  }

  render() {
    return (
      <PaymentCreationForm
        {...this.props}
        {...this.state}
        onSubmit={this.handleSubmit}
        setFormValue={this.setFormValue}
      />
    )
  }
}

export default StatefulPaymentCreationForm
