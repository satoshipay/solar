import React from "react"
import { Server } from "stellar-sdk"

// TODO: Should probably be stored in context
const horizonLivenet = new Server("https://horizon.stellar.org/")
const horizonTestnet = new Server("https://horizon-testnet.stellar.org/")

export interface HorizonProps {
  horizonLivenet: Server
  horizonTestnet: Server
}

export const withHorizon = <Props extends {}>(
  Component: React.ComponentType<Props & HorizonProps>
) => {
  const WithHorizon = (props: Props) => (
    <Component
      {...props}
      horizonLivenet={horizonLivenet}
      horizonTestnet={horizonTestnet}
    />
  )
  return WithHorizon as React.ComponentType<Props>
}
