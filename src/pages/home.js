import React from 'react'
import { observer } from 'mobx-react'
import WalletList from '../components/WalletList'

const HomePage = ({ wallets }) => (
  <div>
    <WalletList wallets={wallets} />
  </div>
)

export default observer(HomePage)
