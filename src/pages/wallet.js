import React from 'react'
import { observer } from 'mobx-react'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import Divider from 'material-ui/Divider'
import { DetailData, DetailDataSet } from '../components/Data'
import { AccountBalance } from '../components/LumenBalance'
import TransactionList from '../components/TransactionList'

const WalletPage = ({ match: { params }, wallets }) => {
  const wallet = wallets.find(wallet => wallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  return (
    <Card style={{ boxShadow: 'none' }}>
      <CardTitle title={wallet.name} subtitle={wallet.testnet ? 'Testnet' : null} />
      <CardText>
        <DetailDataSet>
          <DetailData label='Balance' value={<AccountBalance publicKey={wallet.publicKey} testnet={wallet.testnet} />} />
          <DetailData label='Public Key' value={wallet.publicKey} />
        </DetailDataSet>
      </CardText>
      {/* TODO: Add "edit" icon button */}
      {/* TODO: Add action buttons (send payment, ...) (in <CardActions>) */}
      {/* TODO: Add advanced actions (backup, delete, merge, ...) */}
      <Divider style={{ marginTop: 20, marginBottom: 20 }} />
      <TransactionList title='Recent transactions' publicKey={wallet.publicKey} testnet={wallet.testnet} />
    </Card>
  )
}

export default observer(WalletPage)
