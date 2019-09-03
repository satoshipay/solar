import React from "react"
import Switch from "@material-ui/core/Switch"
import Typography from "@material-ui/core/Typography"
import { makeStyles } from "@material-ui/core/styles"
import { Box } from "./Box"

const useToggleSectionStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    marginTop: 24,

    "&:first-child": {
      marginTop: 0
    }
  },
  row: {
    display: "flex",
    flexWrap: "nowrap"
  },
  left: {
    flexShrink: 0,
    marginLeft: -12,
    width: 70
  },
  right: {
    flexGrow: 1,
    flexShrink: 0,
    width: "calc(100% - 70px)"
  },
  heading: {
    display: "flex",
    alignItems: "center",
    fontSize: 18,
    height: 48,
    lineHeight: "24px"
  },
  headingSpan: {
    cursor: "pointer"
  }
})

interface Props {
  checked: boolean
  children: React.ReactNode
  disabled?: boolean
  title: React.ReactNode
  onChange?: () => void
  style?: React.CSSProperties
}

function ToggleSection(props: Props) {
  const classes = useToggleSectionStyles()
  const onChange = props.onChange && !props.disabled ? props.onChange : undefined
  return (
    <Box className={classes.root} style={props.style}>
      <Box className={classes.row} alignItems="center">
        <Box className={classes.left}>
          <Switch color="primary" checked={props.checked} disabled={props.disabled} onChange={props.onChange} />
        </Box>
        <Box className={classes.right}>
          <Typography className={classes.heading} variant="h6">
            <span className={classes.headingSpan} onClick={onChange}>
              {props.title}
            </span>
          </Typography>
        </Box>
      </Box>
      <Box className={classes.row}>
        <Box className={classes.left}>{null}</Box>
        <Box className={classes.right}>{props.children}</Box>
      </Box>
    </Box>
  )
}

export default React.memo(ToggleSection)
