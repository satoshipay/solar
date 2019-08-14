import React from "react"
import ReactDOM from "react-dom"

interface Props {
  children: React.ReactNode
  target: HTMLElement | null | undefined
}

function Portal(props: Props) {
  return props.target ? ReactDOM.createPortal(props.children, props.target) : null
}

export default React.memo(Portal)
