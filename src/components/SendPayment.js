import React from 'react'
import Drawer from 'material-ui/Drawer'
import { compose, withHandlers, withState } from 'recompose'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import CloseIcon from 'react-icons/lib/md/close'
import SendIcon from 'react-icons/lib/md/send'
import { Box, HorizontalLayout } from '../layout'

const CloseButton = ({ children, onClick = null }) => (
  <div style={{ position: 'absolute', top: 16, right: 24, cursor: 'pointer', lineHeight: 0 }} onClick={onClick}>
    <CloseIcon style={{ width: 32, height: 32 }} />
  </div>
)

const validatePublicKey = (value, { clearError, setError }) => {
  if (!value.match(/^G[A-Z0-9]{55}$/)) {
    setError(new Error(`Invalid stellar public key.`))
  } else {
    clearError()
  }
}
const validateAmount = (value, { clearError, setError }) => {
  if (!value.match(/^[0-9]+(\.[0-9]+)?$/)) {
    setError(new Error(`Invalid number.`))
  } else {
    // TODO: Check if amount <= balance
    clearError()
  }
}

const showError = error => {
  if (error) {
    return error instanceof Error ? error.message : error
  } else {
    return error
  }
}

const PaymentCreationForm = ({ errors, formValues, setErrors, setFormValues, onSubmit = () => {} }) => {
  const bindErrorCallbacks = fieldName => ({
    clearError: () => setErrors(prevErrors => ({ ...prevErrors, [fieldName]: null })),
    setError: error => setErrors(prevErrors => ({ ...prevErrors, [fieldName]: error }))
  })
  const validate = () => {
    validateAmount(formValues.amount, bindErrorCallbacks('amount'))
    validatePublicKey(formValues.destination, bindErrorCallbacks('destination'))
  }
  const triggerSubmit = () => {
    const { amount, destination } = formValues
    if (validate()) onSubmit({ amount, destination })
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
        onChange={(event, newValue) => setFormValues({ destination: newValue })}
        errorText={showError(errors.destination)}
      />
      <HorizontalLayout>
        <Box shrink>
          <TextField
            floatingLabelText='Amount'
            fullWidth
            value={formValues.amount}
            onChange={(event, newValue) => setFormValues({ amount: newValue })}
            errorText={showError(errors.amount)}
          />
        </Box>
        <Box fixed alignSelf='flex-end' padding='0 0 12px' margin='0 0 0 8px'>
          XLM
        </Box>
      </HorizontalLayout>
      <Box margin='32px 0 0'>
        <RaisedButton primary label='Confirm payment' icon={<SendIcon />} onClick={triggerSubmit} />
      </Box>
    </form>
  )
}

const StatefulPaymentCreationForm = compose(
  withState('formValues', 'setFormValues', {
    amount: '',
    destination: ''
  }),
  withState('errors', 'setErrors', {})
)(PaymentCreationForm)

const SendPaymentDrawer = ({ wallet, open = false, hide = () => {} }) => {
  const hideIfOpen = () => {
    if (open) hide()
  }
  return (
    <Drawer open={open} openSecondary docked={false} onRequestChange={hideIfOpen} width={Math.min(window.innerWidth * 0.75, 700)}>
      <Card style={{ position: 'relative', height: '100%', padding: '0 12px' }}>
        <CardTitle title='Send payment' subtitle={wallet.testnet ? 'Testnet' : null} />
        <CloseButton onClick={hideIfOpen} />
        <CardText>
          <StatefulPaymentCreationForm />
          {/* TODO: onSubmit trigger tx creation, display to user to confirm and eventually submit tx to network */}
        </CardText>
      </Card>
    </Drawer>
  )
}

const addOpenState = compose(
  withState('isOpen', 'setOpenState'),
  withHandlers({
    show: ({ setOpenState }) => () => setOpenState(true),
    hide: ({ setOpenState }) => () => setOpenState(false)
  })
)

export const withSendPaymentTrigger = Component => {
  const PaymentTrigger = ({ isOpen, show, hide, wallet }) => (
    <div style={{ display: 'inherit' }}>
      <Component onCreatePayment={show} />
      <SendPaymentDrawer wallet={wallet} open={isOpen} hide={hide} />
    </div>
  )
  return addOpenState(PaymentTrigger)
}
