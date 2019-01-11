import React from "react"
import Divider from "@material-ui/core/Divider"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Menu from "@material-ui/core/Menu"
import MenuItem from "@material-ui/core/MenuItem"
import DeleteIcon from "@material-ui/icons/Delete"
import EditIcon from "@material-ui/icons/Edit"
import GroupIcon from "@material-ui/icons/Group"
import LockIcon from "@material-ui/icons/LockOutlined"
import MoneyIcon from "@material-ui/icons/AttachMoney"
import VisibilityIcon from "@material-ui/icons/Visibility"
import { Account } from "../../context/accounts"
import { SettingsContextType } from "../../context/settings"
import ContextMenu, { AnchorRenderProps } from "../ContextMenu"

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
  children: (anchorProps: AnchorRenderProps) => React.ReactNode
  settings: SettingsContextType
  onChangePassword: () => void
  onDelete: () => void
  onExport: () => void
  onManageAssets: () => void
  onManageSigners: () => void
  onRename: () => void
}

const AccountContextMenu = (props: MenuProps) => {
  return (
    <ContextMenu
      anchor={props.children}
      menu={({ anchorEl, open, onClose, closeAndCall }) => (
        <Menu anchorEl={anchorEl || undefined} open={open} onClose={onClose}>
          <AccountContextMenuItem
            icon={<MoneyIcon />}
            label="Manage Assets"
            onClick={closeAndCall(props.onManageAssets)}
          />
          <AccountContextMenuItem
            hidden={!props.settings.multiSignature}
            icon={<GroupIcon />}
            label="Manage Signers"
            onClick={closeAndCall(props.onManageSigners)}
          />
          <AccountContextMenuItem
            icon={<VisibilityIcon />}
            label="Export Secret Key"
            onClick={closeAndCall(props.onExport)}
          />
          <Divider />
          <AccountContextMenuItem
            icon={<LockIcon />}
            label={props.account.requiresPassword ? "Change Password" : "Set Password"}
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
