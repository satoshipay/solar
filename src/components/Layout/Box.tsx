import React from "react"
import createBoxStyle, { BoxStyles } from "./createBoxStyle"

const Box = ({
  children,
  component,
  style,
  ...styleProps
}: BoxStyles & {
  children: React.ReactNode
  component?: string
  style?: React.CSSProperties
}) => {
  const inlineStyle = { ...createBoxStyle(styleProps), ...style }
  const Component = component || "div"
  return <Component style={inlineStyle}>{children}</Component>
}

const HorizontalLayout = ({ children, ...styleProps }: BoxStyles & { children: React.ReactNode }) => {
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    ...createBoxStyle(styleProps)
  }
  return <div style={style}>{children}</div>
}

const VerticalLayout = ({ children, ...styleProps }: BoxStyles & { children: React.ReactNode }) => {
  const style: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    ...createBoxStyle(styleProps)
  }
  return <div style={style}>{children}</div>
}

const AspectRatioBox = ({
  children,
  ratio,
  ...styleProps
}: BoxStyles & { children: React.ReactNode; ratio: string }) => {
  let heightOfWidthPercentage = 100

  try {
    const [hratio, vratio] = ratio.split(":")
    heightOfWidthPercentage = (parseFloat(vratio) / parseFloat(hratio)) * 100

    if (heightOfWidthPercentage <= 0 || isNaN(heightOfWidthPercentage)) {
      throw new Error(`Invalid ratio numbers.`)
    }
  } catch (error) {
    throw new Error(`AspectRatioBox: Bad ratio given: "${ratio}". Expected something like "1:2".`)
  }

  const outerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    ...createBoxStyle(styleProps),
    paddingTop: `${heightOfWidthPercentage}%`
  }
  const fillCompleteContainerStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0
  }
  return (
    <div style={outerStyle}>
      <div style={fillCompleteContainerStyle}>{children}</div>
    </div>
  )
}

const FloatingBox = ({ children, ...styleProps }: BoxStyles & { children: React.ReactNode }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1,
    ...createBoxStyle(styleProps)
  }
  return <div style={style}>{children}</div>
}

// To circumvent TypeScript name inference bug: <https://github.com/Microsoft/TypeScript/issues/14127>
export { AspectRatioBox, Box, FloatingBox, HorizontalLayout, VerticalLayout }
