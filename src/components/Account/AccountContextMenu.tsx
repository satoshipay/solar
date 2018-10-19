import React from "react"
import Divider from "@material-ui/core/Divider"
import IconButton from "@material-ui/core/IconButton"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Menu from "@material-ui/core/Menu"
import MenuItem from "@material-ui/core/MenuItem"
import DeleteIcon from "@material-ui/icons/Delete"
import EditIcon from "@material-ui/icons/Edit"
import GroupIcon from "@material-ui/icons/Group"
import LockIcon from "@material-ui/icons/LockOutlined"
import MoreVertIcon from "@material-ui/icons/MoreVert"
import VisibilityIcon from "@material-ui/icons/Visibility"
import { Account } from "../../context/accounts"
import { isMultisigEnabled } from "../../feature-flags"
import ContextMenu from "../ContextMenu"

interface ItemProps {
  hidden?: boolean
  icon: React.ReactElement<any>
  label: string
  onClick: () => void
}

const AccountContextMenuItem = (props: ItemProps) => {
  if (props.hidden) {
    return null
  }
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
  onExport: () => void
  onManageSigners: () => void
  onRename: () => void
  style?: React.CSSProperties
}

const AccountContextMenu = (props: MenuProps) => {
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
            icon={<VisibilityIcon />}
            label="Export Secret Key"
            onClick={closeAndCall(props.onExport)}
          />
          <AccountContextMenuItem
            icon={<LockIcon />}
            label={props.account.requiresPassword ? "Change Password" : "Set Password"}
            onClick={closeAndCall(props.onChangePassword)}
          />
          <Divider component="li" />
          <AccountContextMenuItem icon={<EditIcon />} label="Rename" onClick={closeAndCall(props.onRename)} />
          <AccountContextMenuItem
            hidden={!isMultisigEnabled()}
            icon={<GroupIcon />}
            label="Manage Signers"
            onClick={closeAndCall(props.onManageSigners)}
          />
          <AccountContextMenuItem icon={<DeleteIcon />} label="Delete" onClick={closeAndCall(props.onDelete)} />
        </Menu>
      )}
    />
  )
}

export default AccountContextMenu
