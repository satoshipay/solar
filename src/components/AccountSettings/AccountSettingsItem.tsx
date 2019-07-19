import React from "react"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

const accountSettingsItemStyles: StyleRules = {
  icon: {
    color: "rgba(0, 0, 0, 0.25)",
    fontSize: 48,
    justifyContent: "center",
    marginRight: -8,
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

interface AccountSettingsItemProps {
  children: React.ReactNode
  classes: ClassNameMap<keyof typeof accountSettingsItemStyles>
  icon?: React.ReactElement
  onClick: () => void
}

function NakedAccountSettingsItem(props: AccountSettingsItemProps) {
  return (
    <ListItem button className={props.classes.settingsItem} onClick={props.onClick}>
      {props.children}
      <ListItemIcon className={props.classes.icon}>
        {props.icon || <KeyboardArrowRightIcon className={props.classes.icon} />}
      </ListItemIcon>
    </ListItem>
  )
}

const AccountSettingsItem = withStyles(accountSettingsItemStyles)(NakedAccountSettingsItem)

export default AccountSettingsItem
