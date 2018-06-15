import React from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import SendIcon from 'react-icons/lib/md/send'
import { Transaction } from 'stellar-sdk'
import TransactionSummary from '../TransactionSummary'
import { VerticalLayout } from '../../layout'
import { addFormState, InnerFormProps } from '../../lib/formHandling'
import { signTransaction } from '../../lib/transaction'
import { Wallet } from '../../stores/wallets'

type TxConfirmationValues = {
  password: string | null
}

type TxConfirmationFormProps = {
  transaction: Transaction,
  wallet: Wallet,
  onConfirm?: (signedTx: Transaction) => any,
  onCancel?: () => any
}

const TxConfirmationForm = (props: InnerFormProps<TxConfirmationValues> & TxConfirmationFormProps) => {
  const { transaction, wallet, onConfirm = () => {}, onCancel = () => {} } = props

  const onConfirmationClick = async () => {
    // TODO: Show password input if wallet requires password
    const password = null
    const signedTx = await signTransaction(transaction, wallet, password)
    onConfirm(signedTx)
    // TODO: Error handling
  }
  return (
    <form onSubmit={onConfirmationClick}>
      <VerticalLayout>
        <TransactionSummary transaction={transaction} />
        <RaisedButton primary label='Sign and submit' icon={<SendIcon />} onClick={onConfirmationClick} />
        <RaisedButton label='Cancel' onClick={onCancel} />
      </VerticalLayout>
    </form>
  )
}

const StatefulTxConfirmationForm = addFormState<TxConfirmationValues, TxConfirmationFormProps>({
  defaultValues: {
    password: null
  }
})(TxConfirmationForm)

export default StatefulTxConfirmationForm
