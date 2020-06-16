import Transport from "@ledgerhq/hw-transport-node-ble"
import Str from "@ledgerhq/hw-app-str"
import StellarSdk, { Transaction } from "stellar-sdk"

export interface LedgerObserver {
  add: (device: LedgerWallet) => void
  error: (error: any) => void
  remove: (device: LedgerWallet) => void
}

export interface LedgerWallet {
  id: string
  transport: Transport
  deviceModel?: string
}

let idCounter = 0

let ledgerWallets: LedgerWallet[] = []

// according to docs of Transport: 'each listen() call will first emit all potential device already connected'
export function subscribeLedgerDeviceConnectionChanges(observer: LedgerObserver) {
  const sub = Transport.listen({
    next: async e => {
      const descriptor = e.descriptor as any

      if (e.type === "add" && descriptor.state === "disconnected") {
        const transport = await Transport.open(descriptor)
        const existingWallet = ledgerWallets.find(wallet => wallet.transport.id === transport.id)
        if (existingWallet) {
          existingWallet.transport = transport
        } else {
          const ledgerWallet = { id: `ledger-${idCounter++}`, transport, deviceModel: e.device.name }
          ledgerWallets.push(ledgerWallet)
          observer.add(ledgerWallet)
        }
      } else if (e.type === "remove") {
        const removedWallet = ledgerWallets.find(wallet => wallet.transport.id === descriptor.id)
        if (removedWallet) {
          ledgerWallets = ledgerWallets.filter(wallet => wallet !== removedWallet)
          observer.remove(removedWallet)
        }
      }
    },
    error: observer.error,
    complete: () => undefined
  })

  return sub
}

// For info about the derivation of paths
// see 'https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md#multi-account-hierarchy-for-deterministic-wallets'
export async function getLedgerPublicKey(transport: Transport, account: number = 0) {
  const str = new Str(transport)
  const result = await str.getPublicKey(`44'/148'/${account}'`)
  return result.publicKey
}

export async function signTransactionWithLedger(transport: Transport, account: number = 0, transaction: Transaction) {
  const str = new Str(transport)
  const result = await str.signTransaction(`44'/148'/${account}'`, transaction.signatureBase())

  // add signature to transaction
  const publicKey = await getLedgerPublicKey(transport, account)
  const keyPair = StellarSdk.Keypair.fromPublicKey(publicKey)
  const hint = keyPair.signatureHint()
  const decorated = new StellarSdk.xdr.DecoratedSignature({ hint, signature: result.signature })
  transaction.signatures.push(decorated)
}
