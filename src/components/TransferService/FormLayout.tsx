import React from "react"
import { makeStyles } from "@material-ui/core/styles"

const useFormStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",

    [theme.breakpoints.up(800)]: {
      flexDirection: "row",

      "& > *": {
        flex: "0 0 calc(50% - 16px)",
        marginLeft: 8,
        marginRight: 8
      }
    }
  }
}))

interface FormLayoutProps {
  children: React.ReactNode
}

function FormLayout(props: FormLayoutProps) {
  const classes = useFormStyles()
  return <div className={classes.root}>{props.children}</div>
}

export default React.memo(FormLayout)
