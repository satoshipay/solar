import "threads/register"
import { spawn, ModuleThread } from "threads"
import { NetWorker as NetWorkerInterface } from "./workers/net-worker/worker"

function spawnNetWorker() {
  const worker = new Worker("./workers/net-worker/worker.ts")

  window.addEventListener("message", event => {
    if (event.data && ["app:pause", "app:resume"].indexOf(event.data) > -1) {
      worker.postMessage(event.data)
    }
  })

  return spawn<NetWorker>(worker)
}

async function spawnWorkers() {
  return {
    netWorker: await spawnNetWorker()
  }
}

export const workers = spawnWorkers()

export type NetWorker = ModuleThread<NetWorkerInterface>
