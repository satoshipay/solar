import React from 'react'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import ContextMenu from '../ContextMenu'

const WalletContextMenu = (props: { onRename: () => void }) => {
  return (
    <ContextMenu
      anchor={({ onOpen }) => (
        <span onClick={onOpen}>
          <IconButton color='inherit' style={{ marginTop: -8, marginRight: -8, fontSize: 32 }}>
            <MoreVertIcon />
          </IconButton>
        </span>
      )}
      menu={({ anchorEl, open, onClose, closeAndCall }) => (
        <Menu anchorEl={anchorEl || undefined} open={open} onClose={onClose}>
          <MenuItem onClick={closeAndCall(props.onRename)}>Rename</MenuItem>
        </Menu>
      )}
    />
  )
}

export default WalletContextMenu
