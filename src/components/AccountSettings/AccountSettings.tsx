import React from "react"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import red from "@material-ui/core/colors/red"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import DeleteIcon from "@material-ui/icons/Delete"
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import { Account } from "../../context/accounts"
import { useRouter } from "../../hooks"
import * as routes from "../../routes"

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

const accountSettingsItemStyles: StyleRules = {
  icon: {
    color: "rgba(0, 0, 0, 0.25)",
    fontSize: 48,
    justifyContent: "center",
    marginRight: 0,
    width: 48
  },
  settingsItem: {
    position: "relative",
    padding: "16px 24px",
    background: "#FFFFFF",

    "&:focus": {
      backgroundColor: "#FFFFFF"
    },
    "&:hover": {
      backgroundColor: isMobileDevice ? "#FFFFFF" : "rgb(232, 232, 232)"
    },
    "&:not(:first-child)": {
      borderTop: "1px solid rgba(230, 230, 230, 1.0)"
    }
  }
}

interface AccountSettingItemProps {
  children: React.ReactNode
  classes: ClassNameMap<keyof typeof accountSettingsItemStyles>
  icon?: React.ReactElement
  onClick: () => void
}

function UnstyledAccountSettingItem(props: AccountSettingItemProps) {
  return (
    <ListItem button className={props.classes.settingsItem} onClick={props.onClick}>
      {props.children}
      <ListItemIcon className={props.classes.icon}>
        {props.icon || <KeyboardArrowRightIcon className={props.classes.icon} />}
      </ListItemIcon>
    </ListItem>
  )
}

const AccountSettingItem = withStyles(accountSettingsItemStyles)(UnstyledAccountSettingItem)

interface Props {
  account: Account
}

function AccountSettings(props: Props) {
  const router = useRouter()

  const changePassword = React.useCallback(() => {
    // TODO
  }, [])
  const deleteAccount = React.useCallback(() => {
    router.history.push(routes.deleteAccount(props.account.id))
  }, [])
  const exportSecretKey = React.useCallback(() => {
    // TODO
  }, [])

  return (
    <List style={{ padding: "24px 16px" }}>
      <AccountSettingItem onClick={changePassword}>
        <ListItemText
          primary={props.account.requiresPassword ? "Change Password" : "Set Password"}
          secondary={
            props.account.requiresPassword
              ? "Your account is protected by a password."
              : "Your account is not protected."
          }
        />
      </AccountSettingItem>
      <AccountSettingItem onClick={exportSecretKey}>
        <ListItemText
          primary="Export Secret Key"
          secondary="Decrypt and show your private key. We strongly advise you to save a backup of your secret key."
        />
      </AccountSettingItem>
      <AccountSettingItem icon={<DeleteIcon style={{ color: red[400], fontSize: "80%" }} />} onClick={deleteAccount}>
        <ListItemText
          primary={<span style={{ color: red["500"] }}>Merge or Delete Account</span>}
          secondary={
            <span style={{ color: red["400"] }}>
              Delete this account. Optionally merge the remaining funds into another account.
            </span>
          }
          style={{ color: red[500] }}
        />
      </AccountSettingItem>
    </List>
  )
}

export default React.memo(AccountSettings)
