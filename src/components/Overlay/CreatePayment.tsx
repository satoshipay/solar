import React from 'react'
import { compose, withHandlers, withState } from 'recompose'
import Drawer from 'material-ui/Drawer'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import CloseIcon from 'react-icons/lib/md/close'
import { Transaction } from 'stellar-sdk'
import { createTransaction } from '../../lib/transaction'
import { Wallet } from '../../stores/wallets'
import { withHorizon, HorizonProps } from '../../hocs'
import CreatePaymentForm, { PaymentCreationValues } from '../Form/CreatePayment'
import TxConfirmationForm from '../Form/TxConfirmation'
import SubmissionProgress from '../SubmissionProgress'
import { overlayTypes } from './types'

const CloseButton = (props: { onClick: (event: React.MouseEvent) => any }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 24,
    cursor: 'pointer',
    lineHeight: 0
  }
  return (
    <div style={style} onClick={props.onClick}>
      <CloseIcon style={{ width: 32, height: 32 }} />
    </div>
  )
}

interface CreatePaymentDrawerProps {
  wallet: Wallet,
  open: boolean,
  onClose: () => any
}

interface CreatePaymentDrawerStateProps {
  transaction: Transaction,
  clearTransaction: () => any,
  setTransaction: (tx: Transaction) => any,
  submissionPromise: Promise<any> | null,
  setSubmissionPromise: (promise: Promise<any>) => any
}

const CreatePaymentDrawer = (props: CreatePaymentDrawerProps & CreatePaymentDrawerStateProps & HorizonProps) => {
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
    onClose = () => undefined
  } = props

  const horizon = wallet.testnet ? horizonTestnet : horizonLivenet

  const handleCreationFormSubmit = async (formValues: PaymentCreationValues) => {
    const tx = await createTransaction({ ...formValues, horizon, wallet, testnet: wallet.testnet })
    setTransaction(tx)
    // TODO: Error handling
  }
  const submitSignedTx = (tx: Transaction) => {
    const promise = horizon.submitTransaction(tx)
    setSubmissionPromise(promise)

    promise.then(() => {
      // Close automatically a second after successful submission
      setTimeout(() => onClose(), 1000)
    }).catch(error => {
      throw error
      // TODO: Error handling
    })
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

const StatefulCreatePaymentDrawer = compose<CreatePaymentDrawerProps & CreatePaymentDrawerStateProps & HorizonProps, CreatePaymentDrawerProps & HorizonProps>(
  withState('transaction', 'setTransaction', null),
  withState('submissionPromise', 'setSubmissionPromise', null),
  withHandlers<{ setTransaction: (tx: Transaction | null) => any }, {}>({
    clearTransaction: ({ setTransaction }) => () => setTransaction(null)
  })
)(CreatePaymentDrawer)

export default withHorizon(StatefulCreatePaymentDrawer)

export function create (wallet: Wallet) {
  return {
    type: overlayTypes.CreatePayment,
    wallet
  }
}
