import React from 'react'
import { observer } from 'mobx-react'
import { AccountBalance } from '../components/LumenBalance'
import TransactionList from '../components/TransactionList'
import { derivePublicKey } from '../lib/key'

const WalletPage = ({ match: { params }, wallets }) => {
  const wallet = wallets.find(wallet => wallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  const publicKey = derivePublicKey(wallet.privateKey)

  return (
    <div>
      <h1>{wallet.name}{wallet.testnet ? ' (Testnet)' : ''}</h1>
      <AccountBalance publicKey={publicKey} testnet={wallet.testnet} />
      {/* TODO: Add "edit" icon button */}
      <TransactionList title='Recent transactions' publicKey={publicKey} testnet={wallet.testnet} />
      {/* TODO: Add action buttons (send payment, ...) */}
      {/* TODO: Add advanced actions (backup, delete, merge, ...) */}
    </div>
  )
}

export default observer(WalletPage)
