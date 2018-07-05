import React from 'react'
import Button from '@material-ui/core/Button'
import SendIcon from 'react-icons/lib/md/send'
import { Transaction } from 'stellar-sdk'
import { addFormState, InnerFormProps } from '../../lib/formHandling'
import { signTransaction } from '../../lib/transaction'
import { Account } from '../../stores/accounts'
import { HorizontalLayout, VerticalLayout } from '../Layout/Box'
import TransactionSummary from '../TransactionSummary'

interface TxConfirmationValues {
  password: string | null
}

interface TxConfirmationFormProps {
  account: Account,
  transaction: Transaction,
  onConfirm?: (signedTx: Transaction) => any,
  onCancel?: () => any
}

const TxConfirmationForm = (props: InnerFormProps<TxConfirmationValues> & TxConfirmationFormProps) => {
  const { account, transaction, onConfirm = () => undefined, onCancel = () => undefined } = props

  const onConfirmationClick = async () => {
    // TODO: Show password input if account requires password
    const password = null
    const signedTx = await signTransaction(transaction, account, password)
    onConfirm(signedTx)
    // TODO: Error handling
  }
  return (
    <form onSubmit={onConfirmationClick}>
      <VerticalLayout>
        <TransactionSummary transaction={transaction} />
        <HorizontalLayout justifyContent='center' wrap='wrap'>
          <Button variant='contained' color='primary' onClick={onConfirmationClick} style={{ marginRight: 32 }}>
            <SendIcon style={{ marginRight: 8 }} />
            Sign and submit
          </Button>
          <Button variant='contained' onClick={onCancel}>
            Cancel
          </Button>
        </HorizontalLayout>
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
