import React from "react"
import { Box } from "./Box"
import { useIsMobile } from "../../hooks"
import { primaryBackground } from "../../theme"

// tslint:disable-next-line
const platform = process.env.PLATFORM || require("os").platform()

const isFramelessWindow = platform === "darwin"

function TopOfTopSection(props: { background?: React.CSSProperties["background"] }) {
  if (isFramelessWindow) {
    // Add invisible window-drag area and a bit of additional v-space on top
    // Need to define a static CSS class for it, since `-webkit-app-region` in CSS-in-JS might lead to trouble
    return (
      <div className="mac-frameless-window-invisible-title-bar">
        <div style={{ background: props.background, width: "100%", height: "200%" }} />
      </div>
    )
  } else if (platform === "ios") {
    // Add some additional v-space for the iPhone X notch
    return <div className="iphone-notch-top-spacing" />
  } else {
    return null
  }
}

function PageInset(props: { children: React.ReactNode }) {
  const isSmallScreen = useIsMobile()
  const padding = isSmallScreen ? "8px" : isFramelessWindow ? "16px 24px 8px" : "8px 16px"
  return (
    <Box padding={padding} style={{ position: "relative" }}>
      {props.children}
    </Box>
  )
}

interface SectionProps {
  children: React.ReactNode
  backgroundColor?: React.CSSProperties["backgroundColor"]
  bottom?: boolean
  brandColored?: boolean
  grow?: number
  shrink?: number
  pageInset?: boolean
  top?: boolean
  style?: React.CSSProperties
}

function Section(props: SectionProps) {
  const background = props.brandColored ? primaryBackground : props.backgroundColor || "#fcfcfc"
  const isSmallScreen = useIsMobile()

  const className = [
    platform === "ios" && props.top ? "iphone-notch-top-spacing" : "",
    platform === "ios" ? "iphone-notch-left-spacing" : "",
    platform === "ios" ? "iphone-notch-right-spacing" : "",
    platform === "ios" && props.bottom ? "iphone-notch-bottom-spacing" : ""
  ].join(" ")
  const style: React.CSSProperties = {
    background,
    color: props.brandColored ? "white" : undefined,
    flexGrow: typeof props.grow === "number" ? props.grow : 1,
    flexShrink: typeof props.shrink === "number" ? props.shrink : undefined,
    position: "relative",
    zIndex: props.top ? undefined : 1,
    ...props.style
  }
  const MaybeInset = props.pageInset ? PageInset : React.Fragment
  return (
    <>
      <Box className={className} component="section" padding={16} style={style}>
        {props.top ? <TopOfTopSection background={background} /> : null}
        {/* Add a little padding to the top if window is frameless */}
        {props.top && !isSmallScreen ? <div style={{ width: "100%", padding: "4px 0 0", margin: 0 }} /> : null}
        <MaybeInset>{props.children}</MaybeInset>
      </Box>
    </>
  )
}

// To circumvent TypeScript name inference bug: <https://github.com/Microsoft/TypeScript/issues/14127>
export { Section }
