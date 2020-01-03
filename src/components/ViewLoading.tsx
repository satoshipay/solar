import React from "react"
import CircularProgress from "@material-ui/core/CircularProgress"

function ViewLoading() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        flexShrink: 0,
        justifyContent: "center"
      }}
    >
      <CircularProgress />
    </div>
  )
}

export default ViewLoading
