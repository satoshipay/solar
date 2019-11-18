import "threads/register"
import { spawn } from "threads"
import { NetWorker } from "./workers/net-worker/worker"

async function spawnWorkers() {
  const netWorker = await spawn<NetWorker>(
    new Worker("./workers/net-worker/worker.ts", { name: "net-worker", type: "classic" })
  )

  return {
    netWorker
  }
}

export const workers = spawnWorkers()
