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

    "&$active": {
      opacity: 1
    }
  },
  active: {
    // Only used in conjunction with `slide`
  }
})

interface CarouselProps {
  children: React.ReactNode[]
  current: number
}

function Carousel(props: CarouselProps) {
  const classes = useCarouselStyles(props)
  return (
    <div className={classes.root}>
      <div className={classes.sledge}>
        {props.children.map((content, index) => (
          <div
            key={index}
            className={[classes.slide, index === props.current ? classes.active : ""].join(" ")}
            style={{ flex: "0 0 100%", transform: `translateX(${-100 * props.current}%)` }}
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  )
}

export default React.memo(Carousel)
