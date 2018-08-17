import React from "react"

const Background = (props: { children: React.ReactNode; opacity?: number }) => (
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      opacity: props.opacity,
      textAlign: "center",
      zIndex: -1
    }}
  >
    {props.children}
  </div>
)

export default Background
