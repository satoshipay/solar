import { Messages } from "~shared/ipc"
import { call } from "./ipc"

let discoveryRunning = false

export function isDiscoveryRunning() {
  return discoveryRunning
}

export async function startBluetoothDiscovery() {
  await call(Messages.StartBluetoothDiscovery)
  discoveryRunning = true
}

export async function stopBluetoothDiscovery() {
  await call(Messages.StopBluetoothDiscovery)
  discoveryRunning = false
}

export function isBluetoothAvailable() {
  return call(Messages.IsBluetoothAvailable)
}

export function getConnectedWallets() {
  return call(Messages.GetHardwareWallets)
}

export function requestHardwareAccounts(walletID: string, accountIndices: number[]) {
  return call(Messages.GetHardwareWalletAccounts, walletID, accountIndices)
}

export async function requestHardwareAccount(walletID: string, accountIndex: number) {
  const accounts = await requestHardwareAccounts(walletID, [accountIndex])
  return accounts[0]
}
