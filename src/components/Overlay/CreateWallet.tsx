import React from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import { Keypair } from 'stellar-sdk'
import { createOverlay, CreateWalletOverlay, OverlayTypes } from '../../stores/overlays'
import { createWallet as createWalletInStore } from '../../stores/wallets'
import WalletCreationForm, { WalletCreationValues } from '../Form/CreateWallet'

interface DialogProps {
  open: boolean,
  onClose: () => void,
  testnet: boolean
}

const CreateWalletDialog = (props: DialogProps) => {
  const createWallet = (formValues: WalletCreationValues) => {
    createWalletInStore({
      name: formValues.name,
      keypair: Keypair.fromSecret(formValues.privateKey),
      testnet: props.testnet
    })
    props.onClose()
  }
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{props.testnet ? 'Create Testnet Wallet' : 'Create Wallet'}</DialogTitle>
      <DialogContent>
        <WalletCreationForm onSubmit={createWallet} />
      </DialogContent>
    </Dialog>
  )
}

export default CreateWalletDialog

export function create (testnet: boolean): CreateWalletOverlay {
  return createOverlay(OverlayTypes.CreateWallet, { testnet })
}
