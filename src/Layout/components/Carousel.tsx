import React from "react"
import { makeStyles } from "@material-ui/core/styles"

const useCarouselStyles = makeStyles({
  root: {
    display: "block",
    height: "100%",
    overflow: "auto",
    width: "100%"
  },
  sledge: {
    display: "flex",
    height: "100%",
    justifyContent: "flex-start",
    overflowX: "hidden",
    overflowY: "auto"
  },
  slide: {
    flex: "0 0 100%",
    opacity: 0.5,
    overflow: "auto",
    transition: "opacity .3s, transform .3s",
    willChange: "opacity, transform",

    "&$active": {
      opacity: 1
    }
  },
  active: {
    // Only used in conjunction with `slide`
  }
})

export interface CarouselProps {
  children: React.ReactNode[]
  current: number
}

/**
 * IMPORTANT:
 * You must NOT use the `autoFocus` prop in children of the Carousel as this
 * might cause the Carousel to get stuck in an invalid scroll position (see
 * https://github.com/satoshipay/solar/issues/1069)
 */
function Carousel(props: CarouselProps) {
  const classes = useCarouselStyles(props)

  return (
    <div className={classes.root}>
      <div className={classes.sledge}>
        {props.children.map((content, index) => (
          <div
            key={index}
            className={[classes.slide, index === props.current ? classes.active : ""].join(" ")}
            style={{
              transform: `translateX(${-100 * props.current}%)`
            }}
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(Carousel)
