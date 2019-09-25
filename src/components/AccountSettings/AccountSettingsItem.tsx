import React from "react"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import makeStyles from "@material-ui/core/styles/makeStyles"
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import { breakpoints } from "../../theme"

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

const useAccountSettingsItemStyles = makeStyles({
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
    padding: "16px 24px",
    background: "#FFFFFF",

    [breakpoints.down(600)]: {
      padding: "16px 12px"
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
})

interface AccountSettingsItemProps {
  children: React.ReactNode
  disabled?: boolean
  icon: React.ReactElement
  onClick: () => void
}

function AccountSettingsItem(props: AccountSettingsItemProps) {
  const classes = useAccountSettingsItemStyles()

  return (
    <ListItem button className={classes.settingsItem} disabled={props.disabled} onClick={props.onClick}>
      <ListItemIcon className={classes.icon}>{props.icon}</ListItemIcon>
      {props.children}
      <ListItemIcon className={classes.caret}>
        <KeyboardArrowRightIcon className={classes.caret} />
      </ListItemIcon>
    </ListItem>
  )
}

export default AccountSettingsItem
