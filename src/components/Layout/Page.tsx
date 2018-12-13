import React from "react"
import { Box } from "./Box"
import { primaryBackground } from "../../theme"

// tslint:disable-next-line
const platform = process.env.PLATFORM || require("os").platform()

const FramelessWindowInvisibleTitleBar = (props: { background?: React.CSSProperties["background"] }) => {
  if (platform === "darwin") {
    // Add invisible window-drag area and a bit of additional v-space on top
    // Need to define a static CSS class for it, since `-webkit-app-region` in CSS-in-JS might lead to trouble
    return (
      <div className="mac-frameless-window-invisible-title-bar">
        <div style={{ background: props.background, width: "100%", height: "200%" }} />
      </div>
    )
  } else {
    return null
  }
}

interface SectionProps {
  children: React.ReactNode
  backgroundColor?: React.CSSProperties["backgroundColor"]
  brandColored?: boolean
  top?: boolean
  style?: React.CSSProperties
}

const Section = (props: SectionProps) => {
  const background = props.brandColored ? primaryBackground : props.backgroundColor || "white"
  const style: React.CSSProperties = {
    background,
    color: props.brandColored ? "white" : undefined,
    flexGrow: 1,
    position: "relative",
    zIndex: props.top ? undefined : 1,
    ...props.style
  }
  return (
    <>
      {props.top ? <FramelessWindowInvisibleTitleBar background={background} /> : null}
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
