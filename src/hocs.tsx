import React from 'react'
import CircularProgress from '@material-ui/core/CircularProgress'
import { observer } from 'mobx-react'
import { Server } from 'stellar-sdk'

// TODO: Should probably be stored in context
const horizonLivenet = new Server('https://horizon.stellar.org/')
const horizonTestnet = new Server('https://horizon-testnet.stellar.org/')

export interface HorizonProps {
  horizonLivenet: Server,
  horizonTestnet: Server
}

export const withHorizon = <Props extends {}>(Component: React.ComponentType<Props & HorizonProps>) => {
  const WithHorizon = (props: Props) => <Component {...props} horizonLivenet={horizonLivenet} horizonTestnet={horizonTestnet} />
  return WithHorizon as React.ComponentType<Props>
}

interface SpinnerProps {
  loading?: boolean
}

export const withSpinner = <Props extends {}>(Component: React.ComponentType<Props & SpinnerProps>) => {
  const ObservingComponent = observer(Component)
  const Spinner = () => (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <CircularProgress />
    </div>
  )
  const WithLoader = (props: Props & SpinnerProps) => {
    if (props.loading) {
      return <Spinner />
    } else {
      return <ObservingComponent {...props} />
    }
  }
  return WithLoader
}
