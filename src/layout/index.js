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

export const AspectRatioBox = ({ children, ratio, ...styleProps }) => {
  let heightOfWidthPercentage = 100

  try {
    const [ hratio, vratio ] = String(ratio).split(':')
    heightOfWidthPercentage = parseFloat(vratio) / parseFloat(hratio) * 100

    if (heightOfWidthPercentage <= 0 || isNaN(heightOfWidthPercentage)) throw new Error(`Invalid ratio numbers.`)
  } catch (error) {
    throw new Error(`AspectRatioBox: Bad ratio given: "${ratio}". Expected something like "1:2".`)
  }

  const outerStyle = {
    position: 'relative',
    width: '100%',
    ...createBoxStyle(styleProps),
    paddingTop: `${heightOfWidthPercentage}%`
  }
  const fillCompleteContainerStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0
  }
  return (
    <div style={outerStyle}>
      <div style={fillCompleteContainerStyle}>{children}</div>
    </div>
  )
}

export const FloatingBox = ({ children, ...styleProps }) => {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
    ...createBoxStyle(styleProps)
  }
  return (
    <div style={style}>{children}</div>
  )
}
