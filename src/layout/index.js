import React from 'react'
import createBoxStyle from './createBoxStyle'

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
