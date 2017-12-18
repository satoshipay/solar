import React from 'react'
import { observer } from 'mobx-react'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import { AccountBalance } from '../components/LumenBalance'
import TransactionList from '../components/TransactionList'
import { derivePublicKey } from '../lib/key'

const WalletPage = ({ match: { params }, wallets }) => {
  const wallet = wallets.find(wallet => wallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  const publicKey = derivePublicKey(wallet.privateKey)

  return (
    <Card>
      <CardTitle title={wallet.name} subtitle={wallet.testnet ? 'Testnet' : null} />
      <CardText>
        <AccountBalance publicKey={publicKey} testnet={wallet.testnet} />
      </CardText>
      {/* TODO: Add "edit" icon button */}
      {/* TODO: Add action buttons (send payment, ...) (in <CardActions>) */}
      {/* TODO: Add advanced actions (backup, delete, merge, ...) */}
      <TransactionList title='Recent transactions' publicKey={publicKey} testnet={wallet.testnet} />
    </Card>
  )
}

export default observer(WalletPage)
