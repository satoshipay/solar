import React from "react"
import { Box } from "./Box"

const Section = (props: { children: React.ReactNode; style?: React.CSSProperties }) => {
  return (
    <Box component="section" padding={16} style={props.style}>
      {props.children}
    </Box>
  )
}

// To circumvent TypeScript name inference bug: <https://github.com/Microsoft/TypeScript/issues/14127>
export { Section }
