import React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import SendIcon from 'react-icons/lib/md/send'
import { Box, HorizontalLayout } from '../../layout'
import { addFormState, renderError } from '../../lib/formHandling'

const validatePublicKey = value => {
  if (!value.match(/^G[A-Z0-9]{55}$/)) {
    return new Error(`Invalid stellar public key.`)
  }
}
const validateAmount = value => {
  if (!value.match(/^[0-9]+(\.[0-9]+)?$/)) {
    return new Error(`Invalid number.`)
  }
  // TODO: Check if amount <= balance
}

const PaymentCreationForm = ({ errors, formValues, setErrors, setFormValue, validate, onSubmit = () => {} }) => {
  const triggerSubmit = () => {
    if (validate(formValues)) onSubmit(formValues)
  }
  const handleSubmitEvent = event => {
    event.preventDefault()
    triggerSubmit()
  }
  return (
    <form onSubmit={handleSubmitEvent}>
      <TextField
        floatingLabelText='Destination address'
        hintText='GABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS'
        fullWidth
        autoFocus
        value={formValues.destination}
        onChange={(event, newValue) => setFormValue('destination', newValue)}
        errorText={renderError(errors.destination)}
      />
      <HorizontalLayout>
        <Box shrink>
          <TextField
            floatingLabelText='Amount'
            fullWidth
            value={formValues.amount}
            onChange={(event, newValue) => setFormValue('amount', newValue)}
            errorText={renderError(errors.amount)}
          />
        </Box>
        <Box fixed alignSelf='flex-end' padding='0 0 12px' margin='0 0 0 8px'>
          XLM
        </Box>
      </HorizontalLayout>
      <Box margin='32px 0 0'>
        <RaisedButton primary label='Create Payment' icon={<SendIcon />} onClick={triggerSubmit} />
      </Box>
    </form>
  )
}

const StatefulPaymentCreationForm = addFormState({
  defaultValues: {
    destination: '',
    amount: ''
  },
  validators: {
    destination: validatePublicKey,
    amount: validateAmount
  }
})(PaymentCreationForm)

export default StatefulPaymentCreationForm
