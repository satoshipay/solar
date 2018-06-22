import React from 'react'
import { storiesOf } from '@storybook/react'
import { AccountBalance } from '../src/components/Balance'

storiesOf('AccountBalance', module)
  .add('default', () => (
    <div>
      Current balance: <AccountBalance publicKey='GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W' testnet />
    </div>
  ))
