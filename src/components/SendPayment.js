import React from 'react'
import Drawer from 'material-ui/Drawer'
import { compose, withHandlers, withState } from 'recompose'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import CloseIcon from 'react-icons/lib/md/close'
import SendIcon from 'react-icons/lib/md/send'
import { Box, HorizontalLayout } from '../layout'
import { addFormState, renderError } from '../lib/formHandling'

const CloseButton = ({ children, onClick = null }) => (
  <div style={{ position: 'absolute', top: 16, right: 24, cursor: 'pointer', lineHeight: 0 }} onClick={onClick}>
    <CloseIcon style={{ width: 32, height: 32 }} />
  </div>
)

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
        <RaisedButton primary label='Confirm payment' icon={<SendIcon />} onClick={triggerSubmit} />
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
          {/* TODO: onSubmit trigger tx creation, make user confirm account creation if destination account does not exist yet and eventually submit tx to network */}
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
