import { Messages } from "../shared/ipc"
import { expose } from "./_ipc"

expose(Messages.BioAuthAvailable, () => ({ available: false, enrolled: false }))
