import React from 'react'

const createBoxStyle = styleProps => {
  const {
    width = null,
    height = null,
    grow = false,
    shrink = false,
    fixed = false,
    padding = 0,
    margin = 0,
    overflow = 'visible',
    alignSelf = null
  } = styleProps

  const style = {
    margin,
    padding,
    overflow
  }
  if (width) {
    style.width = width
  }
  if (height) {
    style.height = height
  }
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

export const Box = ({ children, ...styleProps }) => {
  const style = createBoxStyle(styleProps)
  return (
    <div style={style}>{children}</div>
  )
}

export const HorizontalLayout = ({ children, ...styleProps }) => {
  const style = {
    display: 'flex',
    flexDirection: 'row',
    ...createBoxStyle(styleProps)
  }
  return (
    <div style={style}>{children}</div>
  )
}

export const VerticalLayout = ({ children, ...styleProps }) => {
  const style = {
    display: 'flex',
    flexDirection: 'column',
    ...createBoxStyle(styleProps)
  }
  return (
    <div style={style}>{children}</div>
  )
}
