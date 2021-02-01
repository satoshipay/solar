import Box from "@material-ui/core/Box"
import Button from "@material-ui/core/Button"
import TextField from "@material-ui/core/TextField"
import Typography from "@material-ui/core/Typography"
import QRCode from "qrcode.react"
import React from "react"
import SimplePeer from "simple-peer"
import { useClipboard } from "~Generic/hooks/userinterface"
import { VerticalLayout } from "~Layout/components/Box"

interface RenderFunctionProps {
  sendMessage: (message: string) => void
}

interface PeerConnectionProps {
  children: (props: RenderFunctionProps) => React.ReactNode
  initiator: boolean
}

function PeerConnection(props: PeerConnectionProps) {
  const { children } = props
  const clipboard = useClipboard()
  const [connected, setConnected] = React.useState(false)
  const [signal, setSignal] = React.useState<string | null>(null)
  const [signalResponse, setSignalResponse] = React.useState<string>("")

  const peer = React.useMemo(() => new SimplePeer({ initiator: props.initiator, trickle: false }), [props.initiator])

  const copyToClipboard = React.useCallback(() => signal && clipboard.copyToClipboard(signal), [clipboard, signal])

  const sendMessage = React.useCallback(
    (message: string) => {
      peer.send(message)
    },
    [peer]
  )

  React.useEffect(() => {
    peer.on("error", err => console.log("error", err))

    peer.on("signal", data => {
      setSignal(JSON.stringify(data))
      console.log("SIGNAL", JSON.stringify(data))
    })

    peer.on("connect", () => {
      console.log("CONNECT")
      const message = "Hello from Solar" + Math.random()
      console.log("Sending message", message)
      peer.send(message)
      setConnected(true)
    })

    peer.on("close", () => {
      console.log("Peer closed")
      setConnected(false)
    })

    peer.on("data", data => {
      console.log("data: " + data)
    })
  }, [peer])

  const InitiatorContent = React.useMemo(() => {
    return (
      <VerticalLayout alignItems="center" justifyContent="center">
        {!signal ? (
          <Typography>Initializing...</Typography>
        ) : !connected ? (
          <>
            <Box onClick={copyToClipboard} margin="0 auto" style={{ cursor: "pointer" }}>
              <QRCode size={256} value={signal} />
            </Box>
            <Box margin="16px auto">
              <Button onClick={copyToClipboard} style={{ marginBottom: 12 }} variant="outlined">
                Copy to Clipboard
              </Button>
            </Box>
            <TextField fullWidth onChange={e => setSignalResponse(e.target.value)} value={signalResponse} />
            <Button
              onClick={() => signalResponse && peer.signal(signalResponse)}
              style={{ marginBottom: 12 }}
              variant="outlined"
            >
              Connect
            </Button>
          </>
        ) : (
          children({ sendMessage })
        )}
      </VerticalLayout>
    )
  }, [children, connected, copyToClipboard, peer, sendMessage, signal, signalResponse])

  const NotInitiatorContent = React.useMemo(
    () => (
      <VerticalLayout alignItems="center" justifyContent="center">
        <TextField fullWidth onChange={e => setSignalResponse(e.target.value)} value={signalResponse} />
        <Button
          onClick={() => signalResponse && peer.signal(signalResponse)}
          style={{ marginBottom: 12 }}
          variant="outlined"
        >
          Connect
        </Button>
        {signal && (
          <VerticalLayout>
            <Box onClick={copyToClipboard} margin="0 auto" style={{ cursor: "pointer" }}>
              <QRCode size={256} value={signal} />
            </Box>
            <Box margin="16px auto">
              <Button onClick={copyToClipboard} style={{ marginBottom: 12 }} variant="outlined">
                Copy to Clipboard
              </Button>
            </Box>
          </VerticalLayout>
        )}
      </VerticalLayout>
    ),
    [copyToClipboard, peer, signal, signalResponse]
  )

  return props.initiator ? InitiatorContent : NotInitiatorContent
}

export default PeerConnection
