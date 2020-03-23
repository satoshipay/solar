import React from "react"

export function HorizontalMargin(props: { grow?: number; shrink?: number; size: number }) {
  return <div style={{ flexGrow: props.grow || 0, flexShrink: props.shrink || 0, marginLeft: props.size }} />
}

export function VerticalMargin(props: { grow?: number; shrink?: number; size: number }) {
  return <div style={{ flexGrow: props.grow || 0, flexShrink: props.shrink || 0, marginTop: props.size }} />
}
