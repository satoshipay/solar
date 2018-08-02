import React from "react"
import IconButton from "@material-ui/core/IconButton"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Menu from "@material-ui/core/Menu"
import MenuItem from "@material-ui/core/MenuItem"
import DeleteIcon from "@material-ui/icons/Delete"
import EditIcon from "@material-ui/icons/Edit"
import MoreVertIcon from "@material-ui/icons/MoreVert"
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
  onDelete: () => void
  onRename: () => void
}

const AccountContextMenu = (props: MenuProps) => {
  return (
    <ContextMenu
      anchor={({ onOpen }) => (
        <span onClick={onOpen}>
          <IconButton color="inherit" style={{ marginTop: -8, marginRight: -8, fontSize: 32 }}>
            <MoreVertIcon />
          </IconButton>
        </span>
      )}
      menu={({ anchorEl, open, onClose, closeAndCall }) => (
        <Menu anchorEl={anchorEl || undefined} open={open} onClose={onClose}>
          <AccountContextMenuItem icon={<EditIcon />} label="Rename" onClick={closeAndCall(props.onRename)} />
          <AccountContextMenuItem icon={<DeleteIcon />} label="Delete" onClick={closeAndCall(props.onDelete)} />
        </Menu>
      )}
    />
  )
}

export default AccountContextMenu
