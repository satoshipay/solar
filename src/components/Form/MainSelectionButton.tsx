import React from "react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import theme from "../../theme"

const useMainSelectionButtonStyles = makeStyles({
  root: {
    background: "white",
    maxWidth: 380,
    padding: "16px 24px",
    position: "relative",
    textAlign: "left"
  },
  buttonLabel: {
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
    textTransform: "initial"
  },
  description: {
    fontSize: 16,
    marginTop: 4,
    paddingLeft: 48
  },
  heading: {
    color: theme.palette.primary.dark,
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.4,
    paddingLeft: 48
  },
  icon: {
    position: "absolute",
    top: "50%",
    left: 16,
    color: "rgba(0, 0, 0, 0.5)",
    marginTop: -20,
    opacity: 0.8,
    transition: `color ${theme.transitions.duration.short}ms`,
    height: 40,
    width: 40,

    "$root:hover &": {
      color: theme.palette.primary.dark
    }
  }
})

interface MainSelectionButtonProps {
  className?: string
  label: React.ReactNode
  description: React.ReactNode
  onClick: () => void
  style?: React.CSSProperties
  Icon?: React.ComponentType
}

function MainSelectionButton(props: MainSelectionButtonProps) {
  const classes = useMainSelectionButtonStyles()
  const Icon = props.Icon || ArrowRightIcon
  return (
    <Button
      classes={{
        root: `${classes.root} ${props.className}`,
        label: classes.buttonLabel
      }}
      onClick={props.onClick}
      style={props.style}
      variant="outlined"
    >
      <Icon className={classes.icon} />
      <Typography className={classes.heading} variant="h6">
        {props.label}
      </Typography>
      <Typography className={classes.description} color="textSecondary" variant="body1">
        {props.description}
      </Typography>
    </Button>
  )
}

export default React.memo(MainSelectionButton)
