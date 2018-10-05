import { Asset, Keypair, Memo, Network, Operation, Server, TransactionBuilder, Transaction, xdr } from "stellar-sdk"
import { createWrongPasswordError } from "../lib/errors"
import { Account } from "../stores/accounts"

const uppercaseFirstLetter = (str: string) => str[0].toUpperCase() + str.slice(1)

export function formatOperationType(operationType: string) {
  return uppercaseFirstLetter(operationType.replace(/([A-Z])/g, letter => " " + letter))
}

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

export async function createTransaction(operations: Array<xdr.Operation<any>>, options: TxBlueprint) {
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
  asset: Asset
  destination: string
  horizon: Server
}

export async function createPaymentOperation(options: PaymentOperationBlueprint) {
  const { amount, asset, destination, horizon } = options
  const destinationAccountExists = await accountExists(horizon, destination)

  if (!destinationAccountExists && !Asset.native().equals(options.asset)) {
    throw new Error(
      `Cannot pay in ${asset.code}, since the destination account does not exist yet. ` +
        `Account creations always need to be done via XLM.`
    )
  }

  const operation = destinationAccountExists
    ? Operation.payment({ destination, amount, asset })
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
