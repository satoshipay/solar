import { workers, NetWorker } from "../worker-controller"

let netWorker: NetWorker | undefined

export function useNetWorker() {
  if (netWorker) {
    return netWorker
  } else {
    // Suspend React component
    throw workers.then(workers => {
      netWorker = workers.netWorker
    })
  }
}
