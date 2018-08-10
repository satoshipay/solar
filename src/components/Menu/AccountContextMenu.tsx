import React from "react"
import IconButton from "@material-ui/core/IconButton"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Menu from "@material-ui/core/Menu"
import MenuItem from "@material-ui/core/MenuItem"
import DeleteIcon from "@material-ui/icons/Delete"
import EditIcon from "@material-ui/icons/Edit"
import LockIcon from "@material-ui/icons/LockOutlined"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import { Account } from "../../stores/accounts"
import ContextMenu from "../ContextMenu"

const AccountContextMenuItem = (props: { icon: React.ReactElement<any>; label: string; onClick: () => void }) => {
  return (
    <MenuItem onClick={props.onClick}>
      <ListItemIcon style={{ marginRight: 8 }}>{props.icon}</ListItemIcon>
      <ListItemText>{props.label}</ListItemText>
    </MenuItem>
  )
}

interface MenuProps {
  account: Account
  onChangePassword: () => void
  onDelete: () => void
  onRename: () => void
  style?: React.CSSProperties
}

const AccountContextMenu = (props: MenuProps) => {
  const labelChangePassword = props.account.requiresPassword ? "Change Password" : "Set Password"
  return (
    <ContextMenu
      anchor={({ onOpen }) => (
        <IconButton color="inherit" onClick={onOpen} style={props.style}>
          <MoreVertIcon />
        </IconButton>
      )}
      menu={({ anchorEl, open, onClose, closeAndCall }) => (
        <Menu anchorEl={anchorEl || undefined} open={open} onClose={onClose}>
          <AccountContextMenuItem
            icon={<LockIcon />}
            label={labelChangePassword}
            onClick={closeAndCall(props.onChangePassword)}
          />
          <AccountContextMenuItem icon={<EditIcon />} label="Rename" onClick={closeAndCall(props.onRename)} />
          <AccountContextMenuItem icon={<DeleteIcon />} label="Delete" onClick={closeAndCall(props.onDelete)} />
        </Menu>
      )}
    />
  )
}

export default AccountContextMenu
