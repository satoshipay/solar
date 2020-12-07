import { Messages } from "../shared/ipc"
import { getOpenWindows } from "../window"
import { expose } from "./_ipc"

expose(Messages.Print, (options?: Electron.WebContentsPrintOptions) => {
  const windows = getOpenWindows()
  if (windows.length) {
    windows[0].webContents.print(options)
  }
})
