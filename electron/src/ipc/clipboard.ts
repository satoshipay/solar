import { clipboard } from "electron"
import { expose } from "./_ipc"
import { Messages } from "../shared/ipc"

expose(Messages.CopyToClipboard, text => clipboard.writeText(text))
