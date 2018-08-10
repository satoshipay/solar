import React from "react"

const removeNullValueProps = (object: { [key: string]: any }) => {
  return Object.keys(object).reduce((result, propKey) => {
    const propValue = object[propKey]
    if (propValue !== null) {
      return { ...result, [propKey]: propValue }
    } else {
      return result
    }
  }, {})
}

interface SizingStyles {
  width?: React.CSSProperties["width"]
  height?: React.CSSProperties["height"]
  maxWidth?: React.CSSProperties["maxWidth"]
  maxHeight?: React.CSSProperties["maxHeight"]
  padding?: React.CSSProperties["padding"]
}

const createSizingStyle = ({
  width = null,
  height = null,
  maxWidth = null,
  maxHeight = null,
  padding = 0
}: SizingStyles) => {
  return {
    padding,
    width,
    height,
    maxWidth,
    maxHeight
  }
}

interface FlexParentStyles {
  alignItems?: string
  justifyContent?: React.CSSProperties["justifyContent"] | "start" | "end"
  wrap?: React.CSSProperties["flexWrap"]
}

const createFlexParentStyle = ({ alignItems, justifyContent, wrap }: FlexParentStyles) => {
  if (justifyContent === "start") {
    justifyContent = "flex-start"
  }
  if (justifyContent === "end") {
    justifyContent = "flex-end"
  }
  if (alignItems === "start") {
    alignItems = "flex-start"
  }
  if (alignItems === "end") {
    alignItems = "flex-end"
  }
  return {
    alignItems,
    justifyContent,
    flexWrap: wrap
  }
}

interface FlexChildStyles {
  grow?: boolean
  shrink?: boolean
  fixed?: boolean
  alignSelf?: React.CSSProperties["alignSelf"]
}

const createFlexChildStyle = ({ grow, shrink, fixed, alignSelf }: FlexChildStyles) => {
  const style: React.CSSProperties = {}

  if (grow) {
    style.flexGrow = 1
  }
  if (shrink) {
    style.flexShrink = 1
  }
  if (fixed) {
    style.flexGrow = 0
    style.flexShrink = 0
  }
  if (alignSelf) {
    style.alignSelf = alignSelf
  }
  return style
}

export type BoxStyles = SizingStyles &
  FlexParentStyles &
  FlexChildStyles & {
    hidden?: boolean
    margin?: React.CSSProperties["margin"]
    overflow?: React.CSSProperties["overflow"]
  }

const createBoxStyle = (styleProps: BoxStyles) => {
  const { hidden = false, margin = 0, overflow = "visible" } = styleProps

  const style = {
    boxSizing: "border-box",
    margin,
    overflow,
    ...(hidden ? { display: "none" } : {}),
    ...createSizingStyle(styleProps),
    ...createFlexParentStyle(styleProps),
    ...createFlexChildStyle(styleProps)
  }
  return removeNullValueProps(style)
}

export default createBoxStyle
