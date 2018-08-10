import { Asset, Keypair, Network, Operation, Server, TransactionBuilder, Transaction } from "stellar-sdk"
import { Account } from "../stores/accounts"
import { addError } from "../stores/notifications"

export function selectNetwork(testnet = false) {
  if (testnet) {
    Network.useTestNetwork()
  } else {
    Network.usePublicNetwork()
  }
}

async function accountExists(horizon: Server, publicKey: string) {
  try {
    await horizon
      .accounts()
      .accountId(publicKey)
      .call()
    return true
  } catch (error) {
    if (error && error.response && error.response.status === 404) {
      return false
    } else {
      throw error
    }
  }
}

interface TxBlueprint {
  amount: string
  destination: string
  horizon: Server
  walletAccount: Account
  testnet?: boolean
}

export async function createTransaction(options: TxBlueprint) {
  const { amount, destination, horizon, walletAccount, testnet = false } = options

  selectNetwork(testnet)

  const account = await horizon.loadAccount(walletAccount.publicKey)
  const tx = new TransactionBuilder(account)
    .addOperation(
      (await accountExists(horizon, destination))
        ? Operation.payment({ destination, amount, asset: Asset.native() })
        : Operation.createAccount({ destination, startingBalance: amount })
    )
    .build()

  return tx
}

export function signTransaction(transaction: Transaction, privateKey: string) {
  transaction.sign(Keypair.fromSecret(privateKey))
  return transaction
}
