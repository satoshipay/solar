import React from "react"
import Switch from "@material-ui/core/Switch"
import Typography from "@material-ui/core/Typography"
import { Box } from "./Box"

interface Props {
  checked: boolean
  children: React.ReactNode
  title: React.ReactNode
  onChange?: () => void
  style?: React.CSSProperties
}

const ToggleSection = (props: Props) => {
  return (
    <Box style={{ display: "flex", margin: "24px 0", ...props.style }}>
      <Box width={70} shrink={0}>
        <Switch color="primary" checked={props.checked} onChange={props.onChange} />
      </Box>
      <Box grow>
        <Typography variant="title" onClick={props.onChange} style={{ cursor: "pointer", marginTop: 12 }}>
          {props.title}
        </Typography>
        {props.children}
      </Box>
    </Box>
  )
}

export default ToggleSection
