import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import AddIcon from 'react-icons/lib/md/add'
import { Keypair } from 'stellar-sdk'
import { addFormState, InnerFormProps } from '../../lib/formHandling'
import { HorizontalLayout } from '../Layout/Box'

const validatePrivateKey = (privateKey: string, values: AccountCreationValues) => {
  if (!values.createNewKey && !privateKey.match(/^S[A-Z0-9]{55}$/)) {
    return new Error(`Invalid stellar public key.`)
  }
}

export interface AccountCreationValues {
  name: string,
  privateKey: string,
  createNewKey: boolean
}

interface AccountCreationFormProps {
  onSubmit (formValues: AccountCreationValues): void
}

const AccountCreationForm = (props: InnerFormProps<AccountCreationValues> & AccountCreationFormProps) => {
  const { formValues, onSubmit, setFormValue, validate } = props
  const triggerSubmit = () => {
    if (!validate(props.formValues)) return

    const privateKey = formValues.createNewKey ? Keypair.random().secret() : formValues.privateKey
    onSubmit({ ...formValues, privateKey })
  }
  const handleSubmitEvent = (event: React.SyntheticEvent) => {
    event.preventDefault()
    triggerSubmit()
  }
  return (
    <form onSubmit={handleSubmitEvent}>
      <TextField
        label='Account name'
        placeholder='Enter custom name here'
        fullWidth
        autoFocus
        margin='dense'
        value={formValues.name}
        onChange={event => setFormValue('name', event.target.value)}
      />
      <TextField
        label='Private key'
        placeholder='SABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS'
        fullWidth
        margin='dense'
        value={formValues.createNewKey ? '' : formValues.privateKey}
        onChange={event => setFormValue('privateKey', event.target.value)}
        style={{ display: formValues.createNewKey ? 'none' : 'block' }}
      />
      <HorizontalLayout margin='32px 0 0' justifyContent='end'>
        <Button onClick={() => setFormValue('createNewKey', false as any)} variant='contained' style={{ marginRight: 16 }}>
          Import key
        </Button>
        <Button variant='contained' color='primary' onClick={triggerSubmit} type='submit'>
          <AddIcon style={{ marginRight: 8, marginTop: -2 }} />
          Add account
        </Button>
      </HorizontalLayout>
    </form>
  )
}

const StatefulAccountCreationForm = addFormState<AccountCreationValues, AccountCreationFormProps>({
  defaultValues: {
    name: '',
    privateKey: '',
    createNewKey: true
  },
  validators: {
    privateKey: validatePrivateKey
  }
})(AccountCreationForm)

export default StatefulAccountCreationForm
