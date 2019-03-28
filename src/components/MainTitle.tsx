import React from "react"
import Typography from "@material-ui/core/Typography"
import { Box, HorizontalLayout } from "./Layout/Box"
import BackButton from "./BackButton"
import { PropTypes } from "@material-ui/core"

interface Props {
  actions?: React.ReactNode
  badges?: React.ReactNode
  onClose: () => void
  style?: React.CSSProperties
  title: React.ReactNode
  titleColor?: PropTypes.Color
}

function MainTitle(props: Props) {
  return (
    <HorizontalLayout alignItems="center" margin="0 0 24px" wrap="wrap" style={props.style}>
      <HorizontalLayout maxWidth="100%">
        <BackButton onClick={props.onClose} style={{ marginLeft: -8, marginRight: 8 }} />
        <Typography
          variant="h5"
          color={props.titleColor}
          style={{
            flexGrow: 1,
            marginTop: 8,
            marginRight: 12,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {props.title}
        </Typography>
        {props.badges}
      </HorizontalLayout>
      <Box grow style={{ textAlign: "right" }}>
        {props.actions}
      </Box>
    </HorizontalLayout>
  )
}

export default MainTitle
