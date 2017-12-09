import React from 'react'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'

const WalletList = ({ wallets }) => (
  <List>
    <Subheader>Wallets</Subheader>
    {wallets.map(wallet => (
      <ListItem key={wallet.id} primaryText={wallet.name} />
    ))}
  </List>
)

export default WalletList
