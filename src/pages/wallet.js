import React from 'react'
import { observer } from 'mobx-react'
import Balance from '../components/Balance'
import { derivePublicKey } from '../lib/key'

const WalletPage = ({ match: { params }, wallets }) => {
  const wallet = wallets.find(wallet => wallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  return (
    <div>
      <h1>{wallet.name}{wallet.testnet ? ' (Testnet)' : ''}</h1>
      <Balance publicKey={derivePublicKey(wallet.privateKey)} testnet={wallet.testnet} />
      {/* TODO: Add "edit" icon button */}
      {/* TODO: Add action buttons (send payment, ...) */}
      {/* TODO: Add advanced actions (backup, delete, merge, ...) */}
    </div>
  )
}

export default observer(WalletPage)
