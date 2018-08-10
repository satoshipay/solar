import React from "react"
import { Box } from "./Box"

const FramelessWindowInvisibleTitleBar = () => {
  if (process.env.PLATFORM === "darwin") {
    // Add invisible window-drag area and a bit of additional v-space on top
    return (
      <>
        <div className="mac-frameless-window-invisible-title-bar" />
        <div style={{ width: "100%", padding: "4px 0 0", margin: 0 }} />
      </>
    )
  } else {
    return null
  }
}

const Section = (props: { children: React.ReactNode; style?: React.CSSProperties; top?: boolean }) => {
  return (
    <Box component="section" padding={16} style={props.style}>
      {props.top ? <FramelessWindowInvisibleTitleBar /> : null}
      {props.children}
    </Box>
  )
}

// To circumvent TypeScript name inference bug: <https://github.com/Microsoft/TypeScript/issues/14127>
export { Section }
