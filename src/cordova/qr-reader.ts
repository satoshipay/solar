import { trackError } from "./error"
import { events, commands, registerCommandHandler } from "./ipc"

const iframe = document.getElementById("walletframe") as HTMLIFrameElement
const backButton = createBackButton()

function createBackButton() {
  const div = document.createElement("div")
  div.style.position = "absolute"
  div.style.left = "50%"
  div.style.bottom = "10%"
  div.style.width = "fit-content"
  div.style.height = "auto"
  div.style.zIndex = "99"
  div.style.background = "rgba(255,255,255,0.5)"
  div.style.textAlign = "center"
  div.style.transform = "translate(-50%, -50%)"

  div.textContent = "GO BACK"
  div.addEventListener("click", () => {
    cleanup()
  })

  return div
}

async function startQRReader(event: MessageEvent, contentWindow: Window) {
  QRScanner.scan((error, result) => {
    if (error) {
      trackError(error)
    } else {
      contentWindow.postMessage({ eventType: events.qrcodeResultEvent, id: event.data.id, qrdata: result }, "*")
    }

    cleanup()
  })

  showQRScanner()
}

function showQRScanner() {
  iframe.setAttribute("style", "visibility: hidden; background-color: transparent;")

  document.body.appendChild(backButton)

  QRScanner.show(() => undefined) // somehow does not work without callback
}

function hideQRScanner() {
  iframe.setAttribute("style", "")

  QRScanner.hide()
}

function cleanup() {
  document.body.removeChild(backButton)

  hideQRScanner()
  QRScanner.destroy()
}

export default function initialize() {
  registerCommandHandler(commands.scanQRCodeCommand, startQRReader)
}
