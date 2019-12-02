import React from "react"
import Button from "@material-ui/core/Button"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import AddIcon from "@material-ui/icons/Add"
import RemoveIcon from "@material-ui/icons/Remove"
import { HorizontalLayout } from "../Layout/Box"
import theme from "../../theme"

const useMainActionButtonStyles = makeStyles({
  root: {
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
    paddingRight: 32
  },
  heading: {
    color: theme.palette.primary.dark,
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.4
  },
  icon: {
    position: "absolute",
    top: "50%",
    right: 16,
    color: theme.palette.grey["A200"],
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

interface MainActionButtonProps {
  className?: string
  label: React.ReactNode
  description: React.ReactNode
  onClick: () => void
  style?: React.CSSProperties
  Icon?: React.ComponentType
}

function MainActionButton(props: MainActionButtonProps) {
  const classes = useMainActionButtonStyles()
  const Icon = props.Icon || ArrowRightIcon
  return (
    <Button
      classes={{ root: `${classes.root} ${props.className}`, label: classes.buttonLabel }}
      onClick={props.onClick}
      style={props.style}
      variant="outlined"
    >
      <Typography className={classes.heading} variant="h6">
        {props.label}
      </Typography>
      <Typography className={classes.description} color="textSecondary" variant="body1">
        {props.description}
      </Typography>
      <Icon className={classes.icon} />
    </Button>
  )
}

interface Props {
  onSelectBuy: () => void
  onSelectSell: () => void
  style?: React.CSSProperties
}

const MainActionSelection = React.forwardRef(function MainActionSelection(
  props: Props,
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <HorizontalLayout ref={ref} justifyContent="space-evenly" padding="0 8px" style={props.style} wrap="wrap">
      <MainActionButton
        label="Buy asset"
        description={"Buy some amount of an asset on the distributed exchange"}
        onClick={props.onSelectBuy}
        style={{ marginBottom: 16 }}
        Icon={AddIcon}
      />
      <MainActionButton
        label="Sell asset"
        description={"Trade some amount of an asset for another one"}
        onClick={props.onSelectSell}
        style={{ marginBottom: 16 }}
        Icon={RemoveIcon}
      />
    </HorizontalLayout>
  )
})

export default React.memo(MainActionSelection)
