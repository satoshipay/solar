import { Messages } from "../shared/ipc"
import { getOpenWindows } from "../window"
import { expose } from "./_ipc"

expose(Messages.Print, () => {
  const windows = getOpenWindows()
  if (windows.length) {
    windows[0].webContents.print()
  }
})
