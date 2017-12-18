import React from 'react'
import Drawer from 'material-ui/Drawer'
import { compose, withHandlers, withState } from 'recompose'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import CloseIcon from 'react-icons/lib/md/close'

const CloseButton = ({ children, onClick = null }) => (
  <div style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer', lineHeight: 0 }} onClick={onClick}>
    <CloseIcon style={{ width: 32, height: 32 }} />
  </div>
)

const SendPaymentDrawer = ({ wallet, open = false, hide = () => {} }) => {
  const hideIfOpen = () => {
    if (open) hide()
  }
  return (
    <Drawer open={open} openSecondary docked={false} onRequestChange={hideIfOpen} width={Math.min(window.innerWidth * 0.75, 700)}>
      <Card style={{ height: '100%' }}>
        <CloseButton onClick={hideIfOpen} />
        <CardTitle title='Send payment' subtitle={wallet.testnet ? 'Testnet' : null} />
        <CardText>
          Content goes here
          {/* TODO */}
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
