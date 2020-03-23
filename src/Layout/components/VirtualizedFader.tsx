import React from "react"
import { makeStyles } from "@material-ui/core/styles"

const useFaderStyles = makeStyles({
  root: {
    display: "block",
    position: "relative",
    height: "100%",
    overflow: "auto",
    width: "100%"
  },
  slide: {
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    overflow: "auto",
    transition: "opacity .3s",
    willChange: "opacity",

    "&$active": {
      opacity: 1
    }
  },
  active: {
    // Only used in conjunction with `slide`
  }
})

interface FaderProps {
  children: React.ReactNode[]
  className?: string
  current: number
  style?: React.CSSProperties
}

function Fader(props: FaderProps) {
  const classes = useFaderStyles()

  return (
    <div className={`${classes.root} ${props.className || ""}`} style={props.style}>
      {props.children.map((child, index) => (
        <div className={[classes.slide, index === props.current ? classes.active : ""].join(" ")} key={index}>
          {child}
        </div>
      ))}
    </div>
  )
}

interface VirtualizedCarouselProps {
  className?: string
  current: React.ReactNode
  index: number
  next?: React.ReactNode
  prev?: React.ReactNode
  size: number
  style?: React.CSSProperties
}

function VirtualizedCarousel(props: VirtualizedCarouselProps) {
  const children: React.ReactNode[] = []

  for (let i = 0; i < props.size; i++) {
    let child: React.ReactNode

    if (i === props.index) {
      child = props.current
    } else if (i === props.index - 1) {
      child = props.prev || null
    } else if (i === props.index + 1) {
      child = props.next || null
    } else {
      child = null
    }

    children.push(<React.Fragment key={i}>{child}</React.Fragment>)
  }

  return (
    <Fader className={props.className} current={props.index} style={props.style}>
      {children}
    </Fader>
  )
}

export default React.memo(VirtualizedCarousel)
