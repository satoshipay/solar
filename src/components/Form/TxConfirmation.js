import React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import SendIcon from 'react-icons/lib/md/send'
import TransactionSummary from '../TransactionSummary'
import { VerticalLayout } from '../../layout'
import { addFormState } from '../../lib/formHandling'
import { signTransaction } from '../../lib/transaction'

const TxConfirmationForm = ({ formValues, setFormValue, transaction, wallet, onConfirm = () => {}, onCancel = () => {} }) => {
  const onConfirmationClick = async () => {
    // TODO: Show password input if wallet requires password
    const password = null
    const signedTx = await signTransaction(transaction, wallet, password)
    onConfirm(signedTx)
    // TODO: Error handling
  }
  return (
    <form onSubmit={onConfirm}>
      <VerticalLayout>
        <TransactionSummary transaction={transaction} />
        <RaisedButton primary label='Sign and submit' icon={<SendIcon />} onClick={onConfirmationClick} />
        <RaisedButton label='Cancel' onClick={onCancel} />
      </VerticalLayout>
    </form>
  )
}

const StatefulTxConfirmationForm = addFormState({
  defaultValues: {
    password: null
  }
})(TxConfirmationForm)

export default StatefulTxConfirmationForm
