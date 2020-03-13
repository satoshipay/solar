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

function Carousel(props: CarouselProps) {
  const { current } = props
  const classes = useCarouselStyles(props)

  // workaround to prevent misalignment of children on initial render
  const refs: Array<React.RefObject<HTMLDivElement>> = props.children.map(() => React.createRef<HTMLDivElement>())
  React.useEffect(() => {
    refs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.style.visibility = index === current ? "visible" : "hidden"
      }
    })

    setTimeout(() => {
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.style.visibility = "visible"
        }
      })
    }, 0)

    setTimeout(() => {
      refs.forEach(ref => {
        if (ref.current) {
          ref.current.style.visibility = "visible"
        }
      })
    }, 500)
  }, [current, refs])

  return (
    <div className={classes.root}>
      <div className={classes.sledge}>
        {props.children.map((content, index) => (
          <div
            ref={refs[index]}
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
