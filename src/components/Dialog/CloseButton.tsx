import React from "react"
import IconButton from "@material-ui/core/IconButton"
import CloseIcon from "@material-ui/icons/Close"

const CloseButton = (props: { onClick: (event: React.MouseEvent) => any }) => {
  const style: React.CSSProperties = {
    position: "absolute",
    top: 12,
    right: 12,
    color: "rgba(0, 0, 0, 0.7)",
    cursor: "pointer",
    lineHeight: 0
  }
  return (
    <IconButton aria-label="Close" onClick={props.onClick} style={style}>
      <CloseIcon style={{ width: 32, height: 32 }} />
    </IconButton>
  )
}

export default CloseButton
