import React from "react"

export function HorizontalMargin(props: { size: number }) {
  return <div style={{ flexGrow: 0, flexShrink: 0, marginLeft: props.size }} />
}

export function VerticalMargin(props: { size: number }) {
  return <div style={{ flexGrow: 0, flexShrink: 0, marginTop: props.size }} />
}
