import { CustomError } from "./errors"
import { workers } from "../../Workers/worker-controller"
import { StellarToml } from "~shared/types/stellar-toml"

const multisigCoordinatorResolutionCache = new Map<string, string>()
const multisigCoordinatorResolutionPending = new Map<string, Promise<string>>()

export async function resolveMultiSignatureCoordinator(domain: string): Promise<string> {
  if (multisigCoordinatorResolutionCache.has(domain)) {
    return multisigCoordinatorResolutionCache.get(domain)!
  } else if (multisigCoordinatorResolutionPending.has(domain)) {
    return multisigCoordinatorResolutionPending.get(domain)!
  } else {
    const { netWorker } = await workers
    const allowHttp = domain.startsWith("localhost:") && process.env.NODE_ENV !== "production"

    const pending = netWorker.fetchStellarToml(domain, { allowHttp, timeout: 10000 }).then(
      (toml: StellarToml | undefined) => {
        const resolved = toml?.MULTISIG_ENDPOINT
        if (!resolved) {
          throw CustomError("MultiSigServiceNotLocatable", `Multi-signature service cannot be located: ${domain}`, {
            domain
          })
        }

        multisigCoordinatorResolutionCache.set(domain, resolved)
        multisigCoordinatorResolutionPending.delete(domain)
        return resolved
      },
      error => {
        multisigCoordinatorResolutionPending.delete(domain)
        throw error
      }
    )

    multisigCoordinatorResolutionPending.set(domain, pending)
    return pending
  }
}
