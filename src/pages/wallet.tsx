import React from 'react'
import { match } from 'react-router'
import { observer } from 'mobx-react'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import Divider from '@material-ui/core/Divider'
import Typography from '@material-ui/core/Typography'
import SendIcon from 'react-icons/lib/md/send'
import { DetailData, DetailDataSet } from '../components/Data'
import { AccountBalance } from '../components/Balance'
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
      <CardContent>
        <Typography variant='headline' component='h2'>
          {wallet.name}
        </Typography>
        <Typography gutterBottom variant='subheading' component='h3'>
          {wallet.testnet ? 'Testnet' : null}
        </Typography>
        <DetailDataSet>
          <DetailData label='Balance' value={<AccountBalance publicKey={wallet.publicKey} testnet={wallet.testnet} />} />
          <DetailData label='Public Key' value={wallet.publicKey} />
        </DetailDataSet>
        <div style={{ marginTop: 24 }}>
          <Button
            variant='contained'
            color='primary'
            onClick={() => openOverlay(createPaymentOverlay(wallet))}
          >
            <SendIcon style={{ marginRight: 8 }} />
            Send payment
          </Button>
        </div>
      </CardContent>
      {/* TODO: Add "edit" icon button */}
      {/* TODO: Add action buttons (send payment, ...) (in <CardActions>) */}
      {/* TODO: Add advanced actions (backup, delete, merge, ...) */}
      <Divider style={{ marginTop: 20, marginBottom: 20 }} />
      <TransactionList title='Recent transactions' publicKey={wallet.publicKey} testnet={wallet.testnet} />
    </Card>
  )
}

export default observer(WalletPage)
