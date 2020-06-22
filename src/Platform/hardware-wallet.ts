import { Messages } from "~shared/ipc"
import { call } from "./ipc"

export function startBluetoothDiscovery() {
  return call(Messages.StartBluetoothDiscovery)
}

export function stopBluetoothDiscovery() {
  return call(Messages.StopBluetoothDiscovery)
}

export function isBluetoothAvailable() {
  return call(Messages.IsBluetoothAvailable)
}
