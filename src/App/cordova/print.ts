import { expose } from "./ipc"
import { Messages } from "~shared/ipc"

function print(content?: string, options?: object) {
  return new Promise<void>((resolve, reject) => {
    cordova.plugins.printer.print(content, options, resolve)
  })
}

export default function initializePrinter() {
  expose(Messages.Print, (storage, keystore, content, options) => print(content, options))
}
