import React from "react"
import Switch from "@material-ui/core/Switch"
import Typography from "@material-ui/core/Typography"
import { Box } from "./Box"

interface Props {
  checked: boolean
  children: React.ReactNode
  disabled?: boolean
  title: React.ReactNode
  onChange?: () => void
  style?: React.CSSProperties
}

const ToggleSection = (props: Props) => {
  const onChange = () => {
    if (props.onChange && !props.disabled) {
      props.onChange()
    }
  }
  return (
    <Box style={{ display: "flex", margin: "24px 0 0", ...props.style }}>
      <Box width={70} shrink={0}>
        <Switch color="primary" checked={props.checked} disabled={props.disabled} onChange={props.onChange} />
      </Box>
      <Box grow shrink={0} width="calc(100% - 70px)">
        <Typography variant="h6" style={{ marginTop: 12 }}>
          <span onClick={onChange} style={{ cursor: "pointer" }}>
            {props.title}
          </span>
        </Typography>
        {props.children}
      </Box>
    </Box>
  )
}

export default ToggleSection
