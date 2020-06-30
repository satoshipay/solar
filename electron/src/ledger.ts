import Transport from "@ledgerhq/hw-transport-node-ble"
import Str from "@ledgerhq/hw-app-str"
import StellarSdk, { Transaction } from "stellar-sdk"
import { expose } from "./ipc/_ipc"
import { Messages } from "./shared/ipc"

export interface LedgerObserver {
  add: (device: LedgerWallet) => void
  error: (error: any) => void
  remove: (device: LedgerWallet) => void
}

export interface LedgerWallet {
  id: string
  transport: Transport
  deviceModel: string
}

const ledgerWallets: LedgerWallet[] = []

expose(Messages.IsBluetoothAvailable, function isBluetoothAvailable() {
  return new Promise<boolean>(resolve => {
    Transport.availability.subscribe({ next: resolve })
  })
})

// starts bluetooth discovery and pairs with available ledger devices
export function subscribeBluetoothConnectionChanges(observer: LedgerObserver) {
  const sub = Transport.listen({
    next: async e => {
      const descriptor = e.descriptor as any

      // only process 'add' events for disconnected devices (i.e. connect to it)
      // there are multiple 'add' events fired for the same device e.g. 'connecting' and 'connected' but we don't handle those
      if (e.type === "add" && descriptor.state === "disconnected") {
        const transport = await Transport.open(descriptor)
        const existingWallet = ledgerWallets.find(wallet => wallet.transport.id === transport.id)
        if (existingWallet) {
          // replace the (probably closed) transport of an existing wallet with the newly opened one
          existingWallet.transport = transport
        } else {
          const t = transport as any
          const deviceModel = t.device.advertisement.localName
            ? t.device.advertisement.localName
            : t.deviceModel.productName
            ? t.deviceModel.productName
            : "Ledger Wallet"
          const ledgerWallet = { id: descriptor.id, transport, deviceModel }
          ledgerWallets.push(ledgerWallet)
          observer.add(ledgerWallet)
        }
      }
    },
    error: observer.error,
    complete: () => undefined
  })
  return sub
}

export async function getLedgerPublicKey(transport: Transport, account: number = 0): Promise<string> {
  const timeout = new Promise<string>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id)
      reject("Timed out.")
    }, 1000)
  })

  const publicKeyPromise = new Promise<string>(async (resolve, reject) => {
    const str = new Str(transport)
    // For info about the derivation of paths
    // see 'https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md#multi-account-hierarchy-for-deterministic-wallets'
    str
      .getPublicKey(`44'/148'/${account}'`)
      .then(result => resolve(result.publicKey))
      .catch(reject)
  })

  // create a timeout because `str.getPublicKey()` does not resolve sometimes
  return Promise.race([timeout, publicKeyPromise])
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
