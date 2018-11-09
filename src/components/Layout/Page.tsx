import React from "react"
import { Box } from "./Box"
import { primaryBackground, primaryBackgroundColor } from "../../theme"

const FramelessWindowInvisibleTitleBar = (props: { backgroundColor?: React.CSSProperties["backgroundColor"] }) => {
  if (process.env.PLATFORM === "darwin") {
    // Add invisible window-drag area and a bit of additional v-space on top
    // Need to define a static CSS class for it, since `-webkit-app-region` in CSS-in-JS might lead to trouble
    const background = props.backgroundColor ? `linear-gradient(${props.backgroundColor}, transparent)` : undefined
    return <div className="mac-frameless-window-invisible-title-bar" style={{ background }} />
  } else {
    return null
  }
}

interface SectionProps {
  children: React.ReactNode
  backgroundColor?: React.CSSProperties["backgroundColor"]
  brandColored?: boolean
  top?: boolean
}

const Section = (props: SectionProps) => {
  const backgroundColor = props.brandColored ? primaryBackgroundColor : props.backgroundColor
  const style: React.CSSProperties = {
    background: props.brandColored ? primaryBackground : props.backgroundColor || "white",
    color: props.brandColored ? "white" : undefined,
    flexGrow: 1,
    position: "relative",
    zIndex: props.top ? undefined : 1
  }
  return (
    <>
      {props.top ? <FramelessWindowInvisibleTitleBar backgroundColor={backgroundColor} /> : null}
      <Box component="section" padding={16} style={style}>
        {/* Add a little padding to the top if window is frameless */}
        {props.top ? <div style={{ width: "100%", padding: "4px 0 0", margin: 0 }} /> : null}
        {props.children}
      </Box>
    </>
  )
}

// To circumvent TypeScript name inference bug: <https://github.com/Microsoft/TypeScript/issues/14127>
export { Section }
