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
    transition: "transform .3s",
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
    boxShadow: "0 8px 12px 0 rgba(0, 0, 0, 0.1)",

    [breakpoints.down(600)]: {
      padding: "16px 12px"
    },

    "&:focus": {
      backgroundColor: "#FFFFFF"
    },
    "&$button:hover": {
      backgroundColor: isMobileDevice ? "#FFFFFF" : "rgb(232, 232, 232)"
    },
    "&:not(:first-child)": {
      borderTop: "1px solid rgba(230, 230, 230, 1.0)"
    }
  },
  button: {
    // only used in conjunction with settingsItem
  },
  rotateRight: {
    transform: "rotate(90deg)"
  }
})

interface AccountSettingsItemProps {
  children: React.ReactNode
  caret?: "show" | "hide" | "rotate-right"
  disabled?: boolean
  icon: React.ReactElement | null | undefined
  onClick?: () => void
}

const AccountSettingsItem = React.forwardRef(function AccountSettingsItem(
  props: AccountSettingsItemProps,
  ref: React.Ref<HTMLLIElement>
) {
  const classes = useAccountSettingsItemStyles()
  const isButton = Boolean(props.onClick)
  const className = `${classes.settingsItem} ${isButton ? classes.button : ""}`

  return (
    <ListItem
      button={isButton as any}
      className={className}
      disabled={props.disabled}
      onClick={props.onClick}
      ref={ref}
    >
      <ListItemIcon className={classes.icon}>{props.icon || <div />}</ListItemIcon>
      {props.children}
      {props.caret !== "hide" ? (
        <ListItemIcon className={`${classes.caret} ${props.caret === "rotate-right" ? classes.rotateRight : ""}`}>
          <KeyboardArrowRightIcon className={classes.caret} />
        </ListItemIcon>
      ) : null}
    </ListItem>
  )
})

export default React.memo(AccountSettingsItem)
