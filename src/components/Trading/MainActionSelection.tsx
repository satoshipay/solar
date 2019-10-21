import React from "react"
import ButtonBase from "@material-ui/core/ButtonBase"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight"
import CallMadeIcon from "@material-ui/icons/CallMade"
import CallReceivedIcon from "@material-ui/icons/CallReceived"
import { HorizontalLayout } from "../Layout/Box"
import theme from "../../theme"

const useMainActionButtonStyles = makeStyles({
  root: {
    alignItems: "flex-start",
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.grey["200"]}`,
    borderRadius: theme.shape.borderRadius,
    boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    maxWidth: 380,
    padding: "16px 24px",
    position: "relative",
    textAlign: "left",
    transition: `background-color ${theme.transitions.duration.short}ms`,

    "&:hover": {
      backgroundColor: theme.palette.action.hover
    }
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
  const classes = useMainActionButtonStyles(props)
  const Icon = props.Icon || ArrowRightIcon
  return (
    <ButtonBase className={`${classes.root} ${props.className}`} onClick={props.onClick} style={props.style}>
      <Typography className={classes.heading} variant="h6">
        {props.label}
      </Typography>
      <Typography className={classes.description} color="textSecondary" variant="body1">
        {props.description}
      </Typography>
      <Icon className={classes.icon} />
    </ButtonBase>
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
        Icon={CallReceivedIcon}
      />
      <MainActionButton
        label="Sell asset"
        description={"Trade some amount of an asset for another one"}
        onClick={props.onSelectSell}
        style={{ marginBottom: 16 }}
        Icon={CallMadeIcon}
      />
    </HorizontalLayout>
  )
})

export default React.memo(MainActionSelection)
