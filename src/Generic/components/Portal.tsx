import React from "react"
import ReactDOM from "react-dom"
import { useIsMobile } from "../hooks/userinterface"

interface Props {
  children: React.ReactElement
  desktop?: "portal" | "inline"
  target: HTMLElement | null | undefined
}

function Portal(props: Props): React.ReactElement | null {
  const isSmallScreen = useIsMobile()

  if (!isSmallScreen && props.desktop === "inline") {
    return props.children || null
  } else {
    return props.target ? ReactDOM.createPortal(props.children, props.target) : null
  }
}

export default React.memo(Portal)
