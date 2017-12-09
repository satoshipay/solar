import React from 'react'

const WalletList = ({ wallets }) => (
  <ul>
    {wallets.map(wallet => (
      <li key={wallet.id}>
        {wallet.name}
      </li>
    ))}
  </ul>
)

export default WalletList
