import { Messages } from "../shared/ipc"
import { expose } from "./_ipc"

expose(Messages.Print, () => {
  window.print()
})
