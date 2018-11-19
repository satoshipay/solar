import React from "react"
import IconButton from "@material-ui/core/IconButton"
import ArrowBackIcon from "@material-ui/icons/ArrowBack"

const BackButton = (props: { onClick?: () => void; style?: React.CSSProperties }) => {
  const style: React.CSSProperties = {
    marginLeft: -10,
    marginRight: 16,
    padding: 6,
    fontSize: 32,
    ...props.style
  }
  return (
    <IconButton color="inherit" onClick={props.onClick} style={style}>
      <ArrowBackIcon style={{ fontSize: "inherit" }} />
    </IconButton>
  )
}

export default BackButton
