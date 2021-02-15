import "threads/register"
import { ModuleThread, registerSerializer, spawn } from "threads"
import { CustomErrorSerializer } from "../Generic/lib/errors"
import { NetWorker as NetWorkerInterface } from "./net-worker"

// Load worker eagerly
const netWorker = new Worker("./net-worker.ts")

registerSerializer(CustomErrorSerializer)

function spawnNetWorker() {
  window.addEventListener("message", event => {
    if (event.data && ["app:pause", "app:resume"].indexOf(event.data) > -1) {
      netWorker.postMessage(event.data)
    }
  })

  return spawn<NetWorkerInterface>(netWorker)
}

async function spawnWorkers() {
  return {
    netWorker: await spawnNetWorker()
  }
}

export const workers = spawnWorkers()

export type NetWorker = ModuleThread<NetWorkerInterface>
