import React from 'react'
import { History } from 'history'
import { withRouter } from 'react-router-dom'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import { Keypair } from 'stellar-sdk'
import * as routes from '../../lib/routes'
import { createOverlay, CreateWalletOverlay, OverlayTypes } from '../../stores/overlays'
import { createWallet as createWalletInStore } from '../../stores/wallets'
import WalletCreationForm, { WalletCreationValues } from '../Form/CreateWallet'

interface DialogProps {
  open: boolean,
  onClose: () => void,
  testnet: boolean
}

const CreateWalletDialog = (props: DialogProps & { history: History }) => {
  const createWallet = (formValues: WalletCreationValues) => {
    const wallet = createWalletInStore({
      name: formValues.name,
      keypair: Keypair.fromSecret(formValues.privateKey),
      testnet: props.testnet
    })
    props.onClose()
    props.history.push(routes.account(wallet.id))
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

export default withRouter<any>(CreateWalletDialog)

export function create (testnet: boolean): CreateWalletOverlay {
  return createOverlay(OverlayTypes.CreateWallet, { testnet })
}
