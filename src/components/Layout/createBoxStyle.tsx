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
  minWidth?: React.CSSProperties["minWidth"]
  maxWidth?: React.CSSProperties["maxWidth"]
  minHeight?: React.CSSProperties["minHeight"]
  maxHeight?: React.CSSProperties["maxHeight"]
  padding?: React.CSSProperties["padding"]
}

const createSizingStyle = ({ width, height, minWidth, maxWidth, minHeight, maxHeight, padding = 0 }: SizingStyles) => {
  return {
    padding,
    width,
    height,
    maxWidth,
    minWidth,
    maxHeight,
    minHeight
  }
}

interface FlexParentStyles {
  alignItems?: React.CSSProperties["alignItems"]
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
  grow?: boolean | number
  shrink?: boolean | number
  fixed?: boolean
  alignSelf?: React.CSSProperties["alignSelf"]
}

const createFlexChildStyle = ({ grow, shrink, fixed, alignSelf }: FlexChildStyles) => {
  const style: React.CSSProperties = {}

  if (typeof grow === "boolean") {
    style.flexGrow = grow ? 1 : 0
  }
  if (typeof grow === "number") {
    style.flexGrow = grow
  }
  if (typeof shrink === "boolean") {
    style.flexShrink = shrink ? 1 : 0
  }
  if (typeof shrink === "number") {
    style.flexShrink = shrink
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

interface TextStyles {
  fontSize?: React.CSSProperties["fontSize"]
  fontWeight?: React.CSSProperties["fontWeight"]
  textAlign?: React.CSSProperties["textAlign"]
}

function createTextStyle({ fontSize, fontWeight, textAlign }: TextStyles) {
  return {
    fontSize,
    fontWeight,
    textAlign
  }
}

export type BoxStyles = SizingStyles &
  FlexParentStyles &
  FlexChildStyles &
  TextStyles & {
    display?: React.CSSProperties["display"]
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
    ...createFlexChildStyle(styleProps),
    ...createTextStyle(styleProps)
  }
  if (styleProps.display) {
    style.display = styleProps.display
  }
  return removeNullValueProps(style)
}

export default createBoxStyle
