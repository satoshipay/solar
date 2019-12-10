import { expose } from "threads"
import * as Multisig from "./multisig"
import * as SEP10 from "./sep-10"
import * as Ecosystem from "./stellar-ecosystem"
import * as Network from "./stellar-network"

// Report serious connection issues
// TODO: resetAllSubscriptions() if a different horizon server has been selected
// TODO: selectTransactionFeeWithFallback(), horizon.fetchTimebounds() (see createTransaction())

const netWorker = {
  ...Ecosystem,
  ...Multisig,
  ...Network,
  ...SEP10
}

export type NetWorker = typeof netWorker

setTimeout(() => {
  // We had some issues with what appeared to be a race condition at worker spawn time
  expose(netWorker)
}, 50)
