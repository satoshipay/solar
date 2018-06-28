import React from 'react'
import { match } from 'react-router'
import { observer } from 'mobx-react'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import indigo from '@material-ui/core/colors/indigo'
import SendIcon from 'react-icons/lib/md/send'
import { DetailData, DetailDataSet } from '../components/Details'
import { AccountBalance } from '../components/Balance'
import Spinner from '../components/Spinner'
import { Transactions } from '../components/Subscribers'
import TransactionList from '../components/TransactionList'
import { Section } from '../components/Layout/Page'
import { create as createPaymentOverlay } from '../components/Overlay/CreatePayment'
import { openOverlay } from '../stores/overlays'
import WalletStore from '../stores/wallets'

const WalletPage = (props: { match: match<{ id: string }>, wallets: typeof WalletStore }) => {
  const { params } = props.match
  const wallet = props.wallets.find(someWallet => someWallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  return (
    <>
      <Section style={{ background: indigo[500] }}>
        <Card style={{ background: 'inherit', boxShadow: 'none', color: 'white' }}>
          <CardContent>
            <Typography align='center' color='inherit' variant='headline' component='h2' gutterBottom>
              {wallet.name}
            </Typography>
            <DetailDataSet>
              <DetailData label='Balance' value={<AccountBalance publicKey={wallet.publicKey} testnet={wallet.testnet} />} />
              <DetailData label='Public Key' value={wallet.publicKey} />
              {wallet.testnet ? <DetailData label='Network' value='Testnet' /> : null}
            </DetailDataSet>
            <div style={{ marginTop: 24 }}>
              <Button
                variant='contained'
                color='default'
                onClick={() => openOverlay(createPaymentOverlay(wallet))}
              >
                <SendIcon style={{ marginRight: 8 }} />
                Send payment
              </Button>
            </div>
            {/* TODO: Add "edit" icon button */}
            {/* TODO: Add action buttons (send payment, ...) (in <CardActions>) */}
            {/* TODO: Add advanced actions (backup, delete, merge, ...) */}
        </CardContent>
        </Card>
      </Section>
      <Section>
        <Transactions publicKey={wallet.publicKey} testnet={wallet.testnet}>
          {({ activated, loading, transactions }) => (
            loading
            ? <Spinner />
            : (
              activated
                ? <TransactionList
                    accountPublicKey={wallet.publicKey}
                    title='Recent transactions'
                    transactions={transactions}
                  />
                : <Typography align='center' color='textSecondary' style={{ margin: '30px auto' }}>Account does not exist on the network</Typography>
            )
          )}
        </Transactions>
      </Section>
    </>
  )
}

export default observer(WalletPage)
