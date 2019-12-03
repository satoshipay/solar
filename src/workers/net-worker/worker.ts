import { expose } from "threads"
import * as multisig from "./multisig"
import * as ecosystem from "./stellar-ecosystem"
import * as network from "./stellar-network"

// TODO: resetAllSubscriptions() (or move the logic that triggers it here, too)
// TODO: SEP-10 web auth

const netWorker = {
  ...ecosystem,
  ...multisig,
  ...network
}

export type NetWorker = typeof netWorker

setTimeout(() => {
  // We had some issues with what appeared to be a race condition at worker spawn time
  expose(netWorker)
}, 50)
