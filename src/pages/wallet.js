import React from 'react'
import { observer } from 'mobx-react'

const WalletPage = ({ match: { params }, wallets }) => {
  const wallet = wallets.find(wallet => wallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  return (
    <div>
      <h1>{wallet.name}{wallet.testnet ? ' (Testnet)' : ''}</h1>
      {/* TODO: <Balance publicKey={derivePublicKey(wallet.privateKey)} />. Build it using recompose's lifecycle(). */}
    </div>
  )
}

export default observer(WalletPage)
