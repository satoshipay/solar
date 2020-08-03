import TransportNodeBLE from "@ledgerhq/hw-transport-node-ble"
// use `node-hid-singleton` package because it handles usb events better than `node-hid` on windows
import TransportNodeHID from "@ledgerhq/hw-transport-node-hid-singleton"
import Str from "@ledgerhq/hw-app-str"
import StellarSdk, { Transaction } from "stellar-sdk"
import { expose } from "./ipc/_ipc"
import { Messages } from "./shared/ipc"

export interface LedgerObserver {
  add: (device: LedgerWallet) => void
  error: (error: any) => void
  remove: (device: LedgerWallet) => void
}

type TransportUnion = TransportNodeBLE & TransportNodeHID

export interface LedgerWallet {
  id: string
  transport: TransportUnion
  deviceModel: string
}

let ledgerWallets: LedgerWallet[] = []

expose(Messages.IsBluetoothAvailable, function isBluetoothAvailable() {
  return new Promise<boolean>(resolve => {
    TransportNodeBLE.availability.subscribe({ next: resolve, error: () => resolve(false) })
  })
})

export function isHIDSupported() {
  return TransportNodeHID.isSupported()
}

function getIdentifierFromDescriptor(descriptor: string) {
  if (descriptor) {
    const identifier = descriptor.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    return identifier
  } else {
    // use default value if descriptor is undefined
    return "hw-wallet"
  }
}

export function subscribeHIDConnectionChanges(observer: LedgerObserver) {
  const sub = TransportNodeHID.listen({
    next: async e => {
      const deviceModel = (e as any).deviceModel

      if (e.type === "add") {
        const transport = await TransportNodeHID.open(e.descriptor)
        const existingWallet = ledgerWallets.find(wallet => wallet.transport.id === transport.id)
        if (existingWallet) {
          // replace the (probably closed) transport of an existing wallet with the newly opened one
          existingWallet.transport = transport
        } else {
          const name = deviceModel && deviceModel.productName ? deviceModel.productName : "Ledger Wallet"
          const ledgerWallet = { id: getIdentifierFromDescriptor(e.descriptor), transport, deviceModel: name }
          ledgerWallets.push(ledgerWallet)
          observer.add(ledgerWallet)
        }
      } else if (e.type === "remove") {
        const existingWallet = ledgerWallets.find(wallet => wallet.id === getIdentifierFromDescriptor(e.descriptor))
        if (existingWallet) {
          ledgerWallets = ledgerWallets.filter(w => w.id !== existingWallet.id)
          observer.remove(existingWallet)
        }
      }
    },
    error: observer.error,
    complete: () => undefined
  })

  return sub
}

// starts bluetooth discovery and pairs with available ledger devices
export function subscribeBluetoothConnectionChanges(observer: LedgerObserver) {
  // listen will only fire 'add' events and no 'remove' events
  const sub = TransportNodeBLE.listen({
    next: async e => {
      const descriptor = e.descriptor as any

      // only process 'add' events for disconnected devices (i.e. connect to it)
      // there are multiple 'add' events fired for the same device e.g. 'connecting' and 'connected' but we don't handle those
      if (e.type === "add" && descriptor.state === "disconnected") {
        const transport = await TransportNodeBLE.open(descriptor)
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

  const interval = setInterval(() => {
    // check if existing wallets disconnected
    for (const wallet of ledgerWallets) {
      if (wallet.transport.device.state === "disconnected") {
        ledgerWallets = ledgerWallets.filter(w => w.id !== wallet.id)
        observer.remove(wallet)
      }
    }
  }, 5000)

  return {
    unsubscribe: () => {
      sub.unsubscribe()
      clearInterval(interval)
    }
  }
}

export async function getLedgerPublicKey(transport: TransportUnion, account: number = 0): Promise<string> {
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

export async function signTransactionWithLedger(
  transport: TransportUnion,
  account: number = 0,
  transaction: Transaction
) {
  const str = new Str(transport)
  const result = await str.signTransaction(`44'/148'/${account}'`, transaction.signatureBase())

  // add signature to transaction
  const publicKey = await getLedgerPublicKey(transport, account)
  const keyPair = StellarSdk.Keypair.fromPublicKey(publicKey)
  const hint = keyPair.signatureHint()
  const decorated = new StellarSdk.xdr.DecoratedSignature({ hint, signature: result.signature })
  transaction.signatures.push(decorated)
}
