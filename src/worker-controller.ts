import "threads/register"
import { spawn, ModuleThread } from "threads"
import { NetWorker as NetWorkerInterface } from "./workers/net-worker/worker"

// Load worker eagerly
const netWorker = new Worker("./workers/net-worker/worker.ts")

function spawnNetWorker() {
  window.addEventListener("message", event => {
    if (event.data && ["app:pause", "app:resume"].indexOf(event.data) > -1) {
      netWorker.postMessage(event.data)
    }
  })

  return spawn<NetWorker>(netWorker)
}

async function spawnWorkers() {
  return {
    netWorker: await spawnNetWorker()
  }
}

export const workers = spawnWorkers()

export type NetWorker = ModuleThread<NetWorkerInterface>
