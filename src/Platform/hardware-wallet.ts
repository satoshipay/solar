import { Messages } from "~shared/ipc"
import { call } from "./ipc"

let discoveryRunning = false
let connectedWallets: HardwareWallet[] = []

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

export function addWallet(wallet: HardwareWallet) {
  connectedWallets.push(wallet)
}

export function removeWallet(wallet: HardwareWallet) {
  connectedWallets = connectedWallets.filter(w => w.id !== wallet.id)
}

export function getConnectedWallets() {
  return connectedWallets
}

export function requestHardwareAccounts(walletID: string, accountIndices: number[]) {
  return call(Messages.GetHardwareWalletAccounts, walletID, accountIndices)
}

export async function requestHardwareAccount(walletID: string, accountIndex: number) {
  const accounts = await requestHardwareAccounts(walletID, [accountIndex])
  return accounts[0]
}
