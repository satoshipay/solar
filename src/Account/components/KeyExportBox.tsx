import QRCode from "qrcode.react"
import React from "react"
import { useTranslation } from "react-i18next"
import Typography from "@material-ui/core/Typography"
import { useClipboard } from "~Generic/hooks/userinterface"
import { Box, VerticalLayout } from "~Layout/components/Box"

interface Props {
  export: string
  hideTapToCopy?: boolean
  size: number
}

function KeyExportBox(props: Props) {
  const clipboard = useClipboard()
  const copyToClipboard = React.useCallback(() => clipboard.copyToClipboard(props.export), [clipboard, props.export])
  const { t } = useTranslation()

  return (
    <VerticalLayout alignItems="center" justifyContent="center">
      <VerticalLayout>
        <Box onClick={copyToClipboard} margin="0 auto" style={{ cursor: "pointer" }}>
          <QRCode size={props.size} value={props.export} />
        </Box>
        <Box margin="16px auto">
          <Typography align="center" style={{ display: props.hideTapToCopy ? "none" : undefined, marginBottom: 12 }}>
            {t("account-settings.export-key.info.tap-to-copy")}:
          </Typography>
          <Typography
            align="center"
            component="p"
            onClick={copyToClipboard}
            role="button"
            style={{ cursor: "pointer", wordWrap: "break-word", maxWidth: window.innerWidth - 75 }}
            variant="subtitle1"
          >
            <b style={{ wordBreak: "break-all" }}>{props.export}</b>
          </Typography>
        </Box>
      </VerticalLayout>
    </VerticalLayout>
  )
}

export default React.memo(KeyExportBox)
