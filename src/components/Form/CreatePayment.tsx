import React from "react"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import SendIcon from "react-icons/lib/md/send"
import { Box, HorizontalLayout } from "../Layout/Box"
import {
  addFormState,
  renderError,
  InnerFormProps
} from "../../lib/formHandling"

const validatePublicKey = (value: string) => {
  if (!value.match(/^G[A-Z0-9]{55}$/)) {
    return new Error(`Invalid stellar public key.`)
  }
}
const validateAmount = (value: string) => {
  if (!value.match(/^[0-9]+(\.[0-9]+)?$/)) {
    return new Error(`Invalid number.`)
  }
  // TODO: Check if amount <= balance
}

export interface PaymentCreationValues {
  amount: string
  destination: string
}

interface PaymentCreationFormProps {
  onSubmit?: (formValues: PaymentCreationValues) => any
}

const PaymentCreationForm = (
  props: InnerFormProps<PaymentCreationValues> & PaymentCreationFormProps
) => {
  const {
    errors,
    formValues,
    setFormValue,
    validate,
    onSubmit = () => undefined
  } = props

  const triggerSubmit = () => {
    if (validate(formValues)) onSubmit(formValues)
  }
  const handleSubmitEvent = (event: React.SyntheticEvent) => {
    event.preventDefault()
    triggerSubmit()
  }
  return (
    <form onSubmit={handleSubmitEvent}>
      <TextField
        error={Boolean(errors.destination)}
        label={
          errors.destination
            ? renderError(errors.destination)
            : "Destination address"
        }
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
        <Button
          variant="contained"
          color="primary"
          onClick={triggerSubmit}
          type="submit"
        >
          <SendIcon style={{ marginRight: 8 }} />
          Create Payment
        </Button>
      </Box>
    </form>
  )
}

const StatefulPaymentCreationForm = addFormState<
  PaymentCreationValues,
  PaymentCreationFormProps
>({
  defaultValues: {
    amount: "",
    destination: ""
  },
  validators: {
    amount: validateAmount,
    destination: validatePublicKey
  }
})(PaymentCreationForm)

export default StatefulPaymentCreationForm
