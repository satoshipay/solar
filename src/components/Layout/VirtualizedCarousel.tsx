import React from "react"
import Carousel from "./Carousel"

interface VirtualizedCarouselProps {
  current: React.ReactNode
  index: number
  next?: React.ReactNode
  prev?: React.ReactNode
  size: number
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

  return <Carousel current={props.index}>{children}</Carousel>
}

export default React.memo(VirtualizedCarousel)
