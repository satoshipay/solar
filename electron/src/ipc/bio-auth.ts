import { expose } from "./_ipc"
import { Messages } from "../shared/ipc"

expose(Messages.BioAuthAvailable, () => false)
