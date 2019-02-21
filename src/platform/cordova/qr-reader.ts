import { useEffect } from "react"
import { sendCommand } from "./message-handler"
import { trackError } from "../../context/notifications"
import { commands } from "../../cordova/ipc"

interface Props {
  onError: (error: Error) => void
  onScan: (data: string) => void
  style?: any // ignored
}

function CordovaQRReader(props: Props): ReturnType<React.FunctionComponent<Props>> {
  useEffect(() => {
    sendCommand(commands.scanQRCodeCommand)
      .then(event => {
        props.onScan(event.data.qrdata)
      })
      .catch(error => {
        props.onError(error)
        trackError(error)
      })
  }, [])
  return null
}

export default CordovaQRReader
