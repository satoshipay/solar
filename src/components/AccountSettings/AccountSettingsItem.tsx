import React from "react"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import { breakpoints } from "../../theme"

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

const accountSettingsItemStyles: StyleRules = {
  caret: {
    color: "rgba(0, 0, 0, 0.35)",
    fontSize: 48,
    justifyContent: "center",
    marginRight: -8,
    width: 48
  },
  icon: {
    fontSize: 28,
    justifyContent: "center",
    marginRight: 4,
    width: 28
  },
  settingsItem: {
    position: "relative",
    padding: "16px 0",
    background: "#FFFFFF",

    [breakpoints.up(600)]: {
      padding: "16px 24px"
    },

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
  icon: React.ReactElement
  onClick: () => void
}

function NakedAccountSettingsItem(props: AccountSettingsItemProps) {
  return (
    <ListItem button className={props.classes.settingsItem} onClick={props.onClick}>
      <ListItemIcon className={props.classes.icon}>{props.icon}</ListItemIcon>
      {props.children}
      <ListItemIcon className={props.classes.caret}>
        <KeyboardArrowRightIcon className={props.classes.caret} />
      </ListItemIcon>
    </ListItem>
  )
}

const AccountSettingsItem = withStyles(accountSettingsItemStyles)(NakedAccountSettingsItem)

export default AccountSettingsItem
