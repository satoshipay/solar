import React from "react"

export const HorizontalMargin = (props: { size: number }) => {
  return <div style={{ flexGrow: 0, flexShrink: 0, marginLeft: props.size }} />
}

export const VerticalMargin = (props: { size: number }) => {
  return <div style={{ flexGrow: 0, flexShrink: 0, marginTop: props.size }} />
}
