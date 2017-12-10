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

export const Box = ({ children, grow, fixed }) => {
  const styleGrow = {
    flexGrow: 1
  }
  const styleFixed = {
    flexGrow: 0,
    flexShrink: 0
  }
  const style = Object.assign({}, grow && styleGrow, fixed && styleFixed)
  return (
    <div style={style}>{children}</div>
  )
}
