import React from "react"
import ListItem from "@material-ui/core/ListItem"
import ListItemText from "@material-ui/core/ListItemText"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { breakpoints } from "../../theme"

const useButtonListItemStyles = makeStyles({
  root: {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 8,
    boxShadow: "none",
    height: 56,
    marginTop: 0,
    marginBottom: 0,

    [breakpoints.down(600)]: {
      height: 52
    },
    [breakpoints.down(350)]: {
      height: 48
    },
    "&:hover": {
      "@media (hover: hover)": {
        backgroundColor: "rgba(0, 0, 0, 0.12)"
      },
      "@media (hover: none)": {
        backgroundColor: "rgba(0, 0, 0, 0.08)"
      }
    }
  },
  gutterBottom: {
    marginBottom: 16
  },
  textTypography: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",

    [breakpoints.down(400)]: {
      fontSize: 14
    }
  }
})

interface ButtonListItemProps {
  children: React.ReactNode
  gutterBottom?: boolean
  onClick: () => void
  style?: React.CSSProperties
}

function ButtonListItem(props: ButtonListItemProps) {
  const classes = useButtonListItemStyles(props)
  return (
    <ListItem
      button
      className={`${classes.root} ${props.gutterBottom ? classes.gutterBottom : ""}`}
      onClick={props.onClick}
      style={props.style}
    >
      <ListItemText classes={{ primary: classes.textTypography }}>{props.children}</ListItemText>
    </ListItem>
  )
}

export default React.memo(ButtonListItem)
