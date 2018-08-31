import { Asset, Keypair, Memo, Network, Operation, Server, TransactionBuilder, Transaction, xdr } from "stellar-sdk"
import { createWrongPasswordError } from "../lib/errors"
import { Account } from "../stores/accounts"

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
  horizon: Server
  memo?: Memo | null
  walletAccount: Account
}

export async function createTransaction(operations: xdr.Operation<any>[], options: TxBlueprint) {
  const { horizon, memo, walletAccount } = options

  selectNetwork(walletAccount.testnet)

  const account = await horizon.loadAccount(walletAccount.publicKey)
  const builder = new TransactionBuilder(account, { memo: memo || undefined })

  for (const operation of operations) {
    builder.addOperation(operation)
  }

  const tx = builder.build()
  return tx
}

interface PaymentOperationBlueprint {
  amount: string
  destination: string
  horizon: Server
}

export async function createPaymentOperation(options: PaymentOperationBlueprint) {
  const { amount, destination, horizon } = options

  const operation = (await accountExists(horizon, destination))
    ? Operation.payment({ destination, amount, asset: Asset.native() })
    : Operation.createAccount({ destination, startingBalance: amount })

  return operation as xdr.Operation<Operation.CreateAccount | Operation.Payment>
}

export async function signTransaction(transaction: Transaction, walletAccount: Account, password: string | null) {
  if (walletAccount.requiresPassword && !password) {
    throw createWrongPasswordError(`Account is password-protected, but no password has been provided.`)
  }

  const privateKey = await walletAccount.getPrivateKey(password)

  transaction.sign(Keypair.fromSecret(privateKey))
  return transaction
}
