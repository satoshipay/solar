import { shell } from "electron"
import { Messages } from "../shared/ipc"
import { expose } from "./_ipc"

expose(Messages.OpenLink, href => shell.openExternal(href))
