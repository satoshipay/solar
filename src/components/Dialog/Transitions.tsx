import React from "react"
import { TransitionProps } from "@material-ui/core/transitions/transition"
import Slide from "@material-ui/core/Slide"

export const SlideUpTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide direction="up" ref={ref} {...props} />
))

export const SlideLeftTransition = React.forwardRef((props: TransitionProps, ref) => (
  <Slide direction="left" ref={ref} {...props} />
))
