import React from "react"
import * as Window from "react-window"

interface FixedSizeListProps {
  children: React.FunctionComponent<Window.ListChildComponentProps>
  container: HTMLElement | null
  itemCount: number
  itemSize: number
}

export function FixedSizeList(props: FixedSizeListProps) {
  if (!props.container) {
    return null
  }

  const height = props.container.clientHeight
  const width = props.container.clientWidth

  return (
    <Window.FixedSizeList height={height} itemCount={props.itemCount} itemSize={props.itemSize} width={width}>
      {props.children}
    </Window.FixedSizeList>
  )
}
