import React from 'react'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'
import { withRouter } from 'react-router-dom'

const WalletList = ({ history, wallets }) => (
  <List>
    <Subheader>Wallets</Subheader>
    {wallets.map(wallet => (
      <ListItem key={wallet.id} primaryText={wallet.name} onClick={() => history.push(`/wallet/${wallet.id}`)} />
    ))}
  </List>
)

export default withRouter(WalletList)
