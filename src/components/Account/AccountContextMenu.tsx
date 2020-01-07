import React from "react"
import Divider from "@material-ui/core/Divider"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Menu from "@material-ui/core/Menu"
import MenuItem from "@material-ui/core/MenuItem"
import { makeStyles } from "@material-ui/core/styles"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import ListIcon from "@material-ui/icons/List"
import MoneyIcon from "@material-ui/icons/AttachMoney"
import SettingsIcon from "@material-ui/icons/Settings"
import SwapHorizIcon from "@material-ui/icons/SwapHoriz"
import { Account } from "../../context/accounts"
import { SettingsContextType } from "../../context/settings"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile } from "../../hooks/userinterface"
import ContextMenu, { AnchorRenderProps } from "../ContextMenu"

const useContextMenuItemStyles = makeStyles({
  disabled: {
    opacity: "1 !important" as any,

    "& > *": {
      opacity: "0.5 !important" as any
    }
  },
  icon: {
    flex: "0 0 24px",
    minWidth: 24,
    marginRight: 24
  }
})

interface ItemProps {
  disabled?: boolean
  hidden?: boolean
  icon: React.ReactElement<any>
  label: string
  onClick: () => void
}

const AccountContextMenuItem = React.memo(
  React.forwardRef((props: ItemProps, ref) => {
    const classes = useContextMenuItemStyles()

    if (props.hidden) {
      return null
    }
    return (
      <MenuItem className={props.disabled ? classes.disabled : ""} disabled={props.disabled} onClick={props.onClick}>
        <ListItemIcon className={classes.icon}>{props.icon}</ListItemIcon>
        <ListItemText ref={ref}>{props.label}</ListItemText>
      </MenuItem>
    )
  })
)

interface MenuProps {
  account: Account
  children: (anchorProps: AnchorRenderProps) => React.ReactNode
  onAccountSettings: () => void
  onAccountTransactions: () => void
  onDeposit: () => void
  onManageAssets: () => void
  onTrade: () => void
  onWithdraw: () => void
  settings: SettingsContextType
  showingSettings: boolean
}

function AccountContextMenu(props: MenuProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const isSmallScreen = useIsMobile()
  const activated = accountData.balances.length > 0

  return (
    <ContextMenu
      anchor={props.children}
      menu={({ anchorEl, open, onClose, closeAndCall }) => (
        <Menu
          anchorEl={isSmallScreen ? document.body : anchorEl || undefined}
          disableAutoFocusItem={isSmallScreen}
          onClose={onClose}
          open={open}
        >
          <AccountContextMenuItem
            disabled={!activated}
            icon={<SwapHorizIcon style={{ transform: "scale(1.2)" }} />}
            label="Trade"
            onClick={closeAndCall(props.onTrade)}
          />
          <AccountContextMenuItem icon={<CallReceivedIcon />} label="Deposit" onClick={closeAndCall(props.onDeposit)} />
          <AccountContextMenuItem
            disabled={!activated}
            icon={<CallMadeIcon />}
            label="Withdraw"
            onClick={closeAndCall(props.onWithdraw)}
          />
          <Divider />
          <AccountContextMenuItem
            disabled={!activated}
            icon={<MoneyIcon />}
            label="Assets & Balances"
            onClick={closeAndCall(props.onManageAssets)}
          />
          {props.showingSettings ? (
            <AccountContextMenuItem
              icon={<ListIcon />}
              label="Transactions"
              onClick={closeAndCall(props.onAccountTransactions)}
            />
          ) : (
            <AccountContextMenuItem
              icon={<SettingsIcon />}
              label="Account Settings"
              onClick={closeAndCall(props.onAccountSettings)}
            />
          )}
        </Menu>
      )}
    />
  )
}

export default React.memo(AccountContextMenu)
