import React from 'react'
import { match } from 'react-router'
import { observer } from 'mobx-react'
import { Card, CardText, CardTitle } from 'material-ui/Card'
import Divider from 'material-ui/Divider'
import RaisedButton from 'material-ui/RaisedButton'
import SendIcon from 'react-icons/lib/md/send'
import { DetailData, DetailDataSet } from '../components/Data'
import { AccountBalance } from '../components/LumenBalance'
import TransactionList from '../components/TransactionList'
import { create as createPaymentOverlay } from '../components/Overlay/CreatePayment'
import { openOverlay } from '../stores/overlays'
import WalletStore from '../stores/wallets'

const WalletPage = (props: { match: match<{ id: string }>, wallets: typeof WalletStore }) => {
  const { params } = props.match
  const wallet = props.wallets.find(someWallet => someWallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  return (
    <Card style={{ boxShadow: 'none' }}>
      <CardTitle title={wallet.name} subtitle={wallet.testnet ? 'Testnet' : null} />
      <CardText>
        <DetailDataSet>
          <DetailData label='Balance' value={<AccountBalance publicKey={wallet.publicKey} testnet={wallet.testnet} />} />
          <DetailData label='Public Key' value={wallet.publicKey} />
        </DetailDataSet>
        <div style={{ marginTop: 24 }}>
          <RaisedButton
            primary
            label='Send payment'
            icon={<SendIcon />}
            onClick={() => openOverlay(createPaymentOverlay(wallet))}
          />
        </div>
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
