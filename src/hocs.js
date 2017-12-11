import React from 'react'
import { Server } from 'stellar-sdk'

// TODO: Should probably be stored in context
const horizon = new Server('https://horizon.stellar.org/')
const horizonTestnet = new Server('https://horizon-testnet.stellar.org/')

export function withHorizon (Component) {
  return (props) => <Component {...props} horizon={horizon} horizonTestnet={horizonTestnet} />
}
