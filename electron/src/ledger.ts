import Transport from "@ledgerhq/hw-transport-node-hid"
import Str from "@ledgerhq/hw-app-str"
import StellarSdk, { Transaction } from "stellar-sdk"

// For info about the derivation of paths
// see 'https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0005.md#multi-account-hierarchy-for-deterministic-wallets'
export async function getLedgerPublicKey(account: number = 0) {
  const transport = await Transport.create()
  const str = new Str(transport)
  const result = await str.getPublicKey(`44'/148'/${account}'`)
  return result.publicKey
}

export async function hasLedgerHardwareWallet() {
  try {
    const publicKey = await getLedgerPublicKey()
    return publicKey ? true : false
  } catch (error) {
    return false
  }
}

export async function signTransactionWithLedger(account: number = 0, transaction: Transaction) {
  const transport = await Transport.create()
  const str = new Str(transport)
  const result = await str.signTransaction(`44'/148'/${account}'`, transaction.signatureBase())

  // add signature to transaction
  const publicKey = await getLedgerPublicKey(account)
  const keyPair = StellarSdk.Keypair.fromPublicKey(publicKey)
  const hint = keyPair.signatureHint()
  const decorated = new StellarSdk.xdr.DecoratedSignature({ hint, signature: result.signature })
  transaction.signatures.push(decorated)
}
