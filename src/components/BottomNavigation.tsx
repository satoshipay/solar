import React from 'react'
import { History, Location } from 'history'
import BottomNavigation from '@material-ui/core/BottomNavigation'
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction'
import Paper from '@material-ui/core/Paper'
import QRCodeIcon from 'react-icons/lib/fa/qrcode'
import HomeIcon from 'react-icons/lib/md/home'
import { withRouter } from 'react-router-dom'

const getSelectedIndexByPath = (path: string) => {
  if (path === '/' || path.startsWith('/wallet')) {
    return 0
  } else if (path.startsWith('/qr-scanner')) {
    return 1
  }
  throw new Error(`Don't know what icon to show as selected in bottom navigation. Path is: ${path}`)
}

const AppBottomNavigation = (props: { history: History, location: Location }) => {
  return (
    <Paper elevation={1}>
      <BottomNavigation showLabels value={getSelectedIndexByPath(props.location.pathname)}>
        <BottomNavigationAction
          label='Wallets'
          icon={<HomeIcon style={{ fontSize: '200%' }} />}
          onClick={() => props.history.push('/')}
        />
        <BottomNavigationAction
          label='QR scanner'
          icon={<QRCodeIcon style={{ fontSize: '200%' }} />}
          onClick={() => props.history.push('/qr-scanner')}
        />
      </BottomNavigation>
    </Paper>
  )
}

export default withRouter(AppBottomNavigation)
