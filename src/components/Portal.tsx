import React from "react"
import ReactDOM from "react-dom"

interface Props {
  children: React.ReactNode
  target: React.RefObject<HTMLElement>
}

function Portal(props: Props) {
  return props.target.current ? ReactDOM.createPortal(props.children, props.target.current) : null
}

export default React.memo(Portal)
