import React from 'react'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import AddIcon from 'react-icons/lib/md/add'
import { addFormState, InnerFormProps } from '../../lib/formHandling'
import { HorizontalLayout } from '../Layout/Box'

const validatePrivateKey = (privateKey: string) => {
  if (!privateKey.match(/^S[A-Z0-9]{55}$/)) {
    return new Error(`Invalid stellar public key.`)
  }
}

export interface WalletCreationValues {
  name: string,
  privateKey: string
}

interface WalletCreationFormProps {
  onSubmit (formValues: WalletCreationValues): void
}

const WalletCreationForm = (props: InnerFormProps<WalletCreationValues> & WalletCreationFormProps) => {
  const { onSubmit, setFormValue, validate } = props
  const triggerSubmit = () => {
    if (validate(props.formValues)) onSubmit(props.formValues)
  }
  const handleSubmitEvent = (event: React.SyntheticEvent) => {
    event.preventDefault()
    triggerSubmit()
  }
  return (
    <form onSubmit={handleSubmitEvent}>
      <TextField
        label={'Wallet name'}
        placeholder='Enter custom name here'
        fullWidth
        autoFocus
        margin='dense'
        value={props.formValues.name}
        onChange={event => setFormValue('name', event.target.value)}
      />
      <TextField
        label={'Private key'}
        placeholder='SABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRS'
        fullWidth
        margin='dense'
        value={props.formValues.privateKey}
        onChange={event => setFormValue('privateKey', event.target.value)}
      />
      <HorizontalLayout margin='32px 0 0' justifyContent='end'>
        <Button variant='contained' color='primary' onClick={triggerSubmit} type='submit'>
          <AddIcon style={{ marginRight: 8, marginTop: -2 }} />
          Add wallet
        </Button>
      </HorizontalLayout>
    </form>
  )
}

const StatefulWalletCreationForm = addFormState<WalletCreationValues, WalletCreationFormProps>({
  defaultValues: {
    name: '',
    privateKey: ''
  },
  validators: {
    privateKey: validatePrivateKey
  }
})(WalletCreationForm)

export default StatefulWalletCreationForm
