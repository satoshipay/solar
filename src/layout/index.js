import React from 'react'

export const VerticalLayout = ({ children }) => {
  const style = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%'
  }
  return (
    <div style={style}>{children}</div>
  )
}

export const Box = ({ children, grow, fixed, padding = 0, overflow = 'visible' }) => {
  const baseStyle = {
    padding,
    overflow
  }
  const growStyle = {
    flexGrow: 1
  }
  const fixedStyle = {
    flexGrow: 0,
    flexShrink: 0
  }
  const style = Object.assign(baseStyle, grow ? growStyle : null, fixed ? fixedStyle : null)
  return (
    <div style={style}>{children}</div>
  )
}
