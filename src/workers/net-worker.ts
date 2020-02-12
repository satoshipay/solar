import { expose, registerSerializer } from "threads"
import { CustomErrorSerializer } from "../lib/errors"
import { ConnectionErrorDescription, ConnectionErrorEvent, Exposed as Errors, ServiceID } from "./net-worker/errors"
import * as Multisig from "./net-worker/multisig"
import * as SEP10 from "./net-worker/sep-10"
import * as Ecosystem from "./net-worker/stellar-ecosystem"
import * as Network from "./net-worker/stellar-network"

// TODO: resetAllSubscriptions() if a different horizon server has been selected
// TODO: selectTransactionFeeWithFallback(), horizon.fetchTimebounds() (see createTransaction())

const netWorker = {
  ...Ecosystem,
  ...Errors,
  ...Multisig,
  ...Network,
  ...SEP10
}

export type NetWorker = typeof netWorker
export type Service = ServiceID

export { ConnectionErrorDescription, ConnectionErrorEvent }

registerSerializer(CustomErrorSerializer)

setTimeout(() => {
  // We had some issues with what appeared to be a race condition at worker spawn time
  expose(netWorker)
}, 50)
