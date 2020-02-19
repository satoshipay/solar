import QRCode from "qrcode.react"
import React from "react"
import Typography from "@material-ui/core/Typography"
import { useClipboard, useIsMobile } from "../../hooks/userinterface"
import { Box, VerticalLayout } from "../Layout/Box"

interface Props {
  export: string
  hideTapToCopy?: boolean
}

function KeyExportBox(props: Props) {
  const clipboard = useClipboard()
  const isSmallScreen = useIsMobile()
  const copyToClipboard = React.useCallback(() => clipboard.copyToClipboard(props.export), [clipboard, props.export])

  return (
    <VerticalLayout alignItems="center" justifyContent="center">
      <VerticalLayout>
        <Box onClick={copyToClipboard} margin="0 auto" style={{ cursor: "pointer" }}>
          <QRCode size={isSmallScreen ? 192 : 256} value={props.export} />
        </Box>
        <Box margin="16px auto">
          <Typography align="center" style={{ display: props.hideTapToCopy ? "none" : undefined, marginBottom: 12 }}>
            Tap to copy:
          </Typography>
          <Typography
            align="center"
            component="p"
            onClick={copyToClipboard}
            role="button"
            style={{ cursor: "pointer", wordWrap: "break-word", maxWidth: window.innerWidth - 75 }}
            variant="subtitle1"
          >
            <b>{props.export}</b>
          </Typography>
        </Box>
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default React.memo(KeyExportBox)
