import React from 'react'
import { History } from 'history'
import { match } from 'react-router'
import { withRouter } from 'react-router-dom'
import { observer } from 'mobx-react'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import indigo from '@material-ui/core/colors/indigo'
import ChevronLeftIcon from 'react-icons/lib/md/chevron-left'
import SendIcon from 'react-icons/lib/md/send'
import { DetailData, DetailDataSet } from '../components/Details'
import { AccountBalance } from '../components/Balance'
import Spinner from '../components/Spinner'
import { Transactions } from '../components/Subscribers'
import TransactionList from '../components/TransactionList'
import { Box, HorizontalLayout } from '../components/Layout/Box'
import { VerticalMargin } from '../components/Layout/Spacing'
import { Section } from '../components/Layout/Page'
import WalletContextMenu from '../components/Menu/WalletContextMenu'
import { create as createPaymentOverlay } from '../components/Overlay/CreatePayment'
import { create as createRenameDialog } from '../components/Overlay/Rename'
import * as routes from '../lib/routes'
import { openOverlay } from '../stores/overlays'
import WalletStore, { renameWallet } from '../stores/wallets'

const BackButton = withRouter((props: { history: History }) => {
  return (
    <IconButton color='inherit' onClick={() => props.history.push(routes.allWallets())} style={{ marginTop: -8, marginLeft: -8, fontSize: 32 }}>
      <ChevronLeftIcon />
    </IconButton>
  )
})

const WalletPage = (props: { history: History, match: match<{ id: string }>, wallets: typeof WalletStore }) => {
  const { params } = props.match
  const wallet = props.wallets.find(someWallet => someWallet.id === params.id)
  if (!wallet) throw new Error(`Wallet not found. ID: ${params.id}`)

  const onRename = () => {
    openOverlay(createRenameDialog('Rename wallet', wallet.name, (newName: string) => renameWallet(wallet.id, newName)))
  }

  return (
    <>
      <Section style={{ background: indigo[500] }}>
        <Card style={{ position: 'relative', background: 'inherit', boxShadow: 'none', color: 'white' }}>
          <CardContent>
            <HorizontalLayout alignItems='space-between'>
              <Box grow>
                <BackButton />
              </Box>
              <Typography align='center' color='inherit' variant='headline' component='h2' gutterBottom>
                {wallet.name}
              </Typography>
              <Box grow style={{ textAlign: 'right' }}>
                <WalletContextMenu onRename={onRename} />
              </Box>
            </HorizontalLayout>
            <VerticalMargin size={28} />
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
