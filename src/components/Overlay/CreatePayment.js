import React from 'react'
import { compose, withHandlers, withState } from 'recompose'
import Drawer from 'material-ui/Drawer'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import CloseIcon from 'react-icons/lib/md/close'
import { createTransaction } from '../../lib/transaction'
import { withHorizon } from '../../hocs'
import CreatePaymentForm from '../Form/CreatePayment'
import TxConfirmationForm from '../Form/TxConfirmation'
import SubmissionProgress from '../SubmissionProgress'

const CloseButton = ({ children, onClick = null }) => (
  <div style={{ position: 'absolute', top: 16, right: 24, cursor: 'pointer', lineHeight: 0 }} onClick={onClick}>
    <CloseIcon style={{ width: 32, height: 32 }} />
  </div>
)

const CreatePaymentDrawer = (props) => {
  const {
    horizonLivenet,
    horizonTestnet,
    wallet,
    open = true,
    transaction,
    clearTransaction,
    setTransaction,
    submissionPromise,
    setSubmissionPromise,
    onClose = () => {}
  } = props

  const horizon = wallet.testnet ? horizonTestnet : horizonLivenet

  const handleCreationFormSubmit = async formValues => {
    const tx = await createTransaction({ ...formValues, horizon, wallet, testnet: wallet.testnet })
    setTransaction(tx)
    // TODO: Error handling
  }
  const submitSignedTx = tx => {
    const promise = horizon.submitTransaction(tx)
    setSubmissionPromise(promise)

    promise.then(() => {
      // Close automatically a second after successful submission
      setTimeout(() => onClose(), 1000)
    })

    // TODO: Error handling
  }

  return (
    <div>
      <Drawer open={open} openSecondary docked={false} onRequestChange={onClose} width='90%'>
        <Card style={{ position: 'relative', height: '100%', padding: '0 12px' }}>
          <CardTitle title='Send payment' subtitle={wallet.testnet ? 'Testnet' : null} />
          <CloseButton onClick={onClose} />
          <CardText>
            <CreatePaymentForm onSubmit={handleCreationFormSubmit} />
          </CardText>
        </Card>
      </Drawer>
      <Drawer open={Boolean(open && transaction)} openSecondary docked={false} onRequestChange={clearTransaction} width='90%'>
        <Card style={{ position: 'relative', height: '100%', padding: '0 12px' }}>
          <CardTitle title='Confirm payment' subtitle={wallet.testnet ? 'Testnet' : null} />
          <CardText>
            {
              transaction
              ? <TxConfirmationForm transaction={transaction} wallet={wallet} onConfirm={submitSignedTx} onCancel={clearTransaction} />
              : null
            }
          </CardText>
        </Card>
        {submissionPromise ? <SubmissionProgress promise={submissionPromise} /> : null}
      </Drawer>
    </div>
  )
}

const StatefulCreatePaymentDrawer = compose(
  withState('transaction', 'setTransaction', null),
  withState('submissionPromise', 'setSubmissionPromise', null),
  withHandlers({
    clearTransaction: ({ setTransaction }) => () => setTransaction(null)
  })
)(CreatePaymentDrawer)

export default withHorizon(StatefulCreatePaymentDrawer)

export function create (wallet) {
  return {
    type: 'CreatePayment',
    wallet
  }
}
