import React from 'react'
import Async from 'react-promise'
import { Asset, Memo, Network, Operation, Server, TransactionBuilder } from 'stellar-sdk'
import { storiesOf } from '@storybook/react'
import { Transactions } from '../src/components/Subscribers'
import TransactionSummary from '../src/components/TransactionSummary'

storiesOf('TransactionSummary', module)
  .add('Payment with memo', () => {
    Network.useTestNetwork()
    const horizon = new Server('https://horizon-testnet.stellar.org')

    const promise = (async () => {
      const account = await horizon.loadAccount('GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W')
      const builder = new TransactionBuilder(account, { memo: Memo.text('Demo transaction') })
      builder.addOperation(Operation.payment({
        amount: '1.5',
        asset: Asset.native(),
        destination: 'GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT'
      }))
      return builder.build()
    })()

    return (
      <Async
        promise={promise}
        then={transaction => <TransactionSummary transaction={transaction} />}
      />
    )
  })
  .add('Account creation & Inflation destination', () => {
    Network.useTestNetwork()
    const horizon = new Server('https://horizon-testnet.stellar.org')

    const promise = (async () => {
      const account = await horizon.loadAccount('GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W')
      const builder = new TransactionBuilder(account, { memo: Memo.text('Demo transaction') })
      builder.addOperation(Operation.createAccount({
        startingBalance: '1.0',
        destination: 'GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT'
      }))
      builder.addOperation(Operation.setOptions({
        inflationDest: 'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT'
      }))
      return builder.build()
    })()

    return (
      <Async
        promise={promise}
        then={transaction => <TransactionSummary transaction={transaction} />}
      />
    )
  })
