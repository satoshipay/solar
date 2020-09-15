import { expose } from "./ipc"
import { Messages } from "~shared/ipc"

function print() {
  return new Promise<void>((resolve, reject) => {
    cordova.plugins.printer.print()
    resolve()
  })
}

export default function initializePrinter() {
  expose(Messages.Print, print)
}
