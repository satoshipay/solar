import React from 'react'
import Drawer from 'material-ui/Drawer'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import CloseIcon from 'react-icons/lib/md/close'
import CreatePaymentForm from '../Form/CreatePayment'

const CloseButton = ({ children, onClick = null }) => (
  <div style={{ position: 'absolute', top: 16, right: 24, cursor: 'pointer', lineHeight: 0 }} onClick={onClick}>
    <CloseIcon style={{ width: 32, height: 32 }} />
  </div>
)

const CreatePaymentDrawer = ({ wallet, open = true, onClose = () => {} }) => {
  const closeIfOpen = () => {
    if (open) onClose()
  }
  return (
    <Drawer open={open} openSecondary docked={false} onRequestChange={closeIfOpen} width={Math.min(window.innerWidth * 0.75, 700)}>
      <Card style={{ position: 'relative', height: '100%', padding: '0 12px' }}>
        <CardTitle title='Send payment' subtitle={wallet.testnet ? 'Testnet' : null} />
        <CloseButton onClick={closeIfOpen} />
        <CardText>
          <CreatePaymentForm />
          {/* TODO: onSubmit trigger tx creation, make user confirm account creation if destination account does not exist yet and eventually submit tx to network */}
        </CardText>
      </Card>
    </Drawer>
  )
}

export default CreatePaymentDrawer

export function create (wallet) {
  return {
    type: 'CreatePayment',
    wallet
  }
}
