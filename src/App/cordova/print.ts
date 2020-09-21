import { expose } from "./ipc"
import { Messages } from "~shared/ipc"

function print(content?: string) {
  return new Promise<void>((resolve, reject) => {
    cordova.plugins.printer.print(
      content,
      {
        monochrome: true,
        paper: {
          width: "210mm",
          height: "297mm"
        },
        maxHeight: {
          width: "210mm",
          height: "297mm"
        }
      },
      resolve
    )
  })
}

export default function initializePrinter() {
  expose(Messages.Print, () => print())
}
