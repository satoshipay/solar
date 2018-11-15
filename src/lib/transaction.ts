import { Asset, Keypair, Memo, Network, Operation, Server, TransactionBuilder, Transaction, xdr } from "stellar-sdk"
import { Account } from "../context/accounts"
import { createWrongPasswordError } from "../lib/errors"

interface SignatureWithHint extends xdr.DecoratedSignature {
  hint(): Buffer
}

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

function getAllSources(tx: Transaction) {
  return dedupe([
    tx.source,
    ...(tx.operations.map(operation => operation.source).filter(source => Boolean(source)) as string[])
  ])
}

export function selectNetwork(testnet = false) {
  if (testnet) {
    Network.useTestNetwork()
  } else {
    Network.usePublicNetwork()
  }
}

export function hasSigned(transaction: Transaction, publicKey: string) {
  return transaction.signatures.some(signature => {
    const hint = (signature as SignatureWithHint).hint()
    const keypair = Keypair.fromPublicKey(publicKey)

    return hint.equals(keypair.rawPublicKey().slice(-hint.byteLength))
  })
}

async function accountExists(horizon: Server, publicKey: string) {
  try {
    const account = await horizon
      .accounts()
      .accountId(publicKey)
      .call()

    // Hack to fix SatoshiPay horizons responding with status 200 and an empty object on non-existent accounts
    return Object.keys(account).length > 0
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

export async function requiresRemoteSignatures(horizon: Server, transaction: Transaction, walletPublicKey: string) {
  const sources = getAllSources(transaction)

  if (sources.length > 1) {
    return true
  }

  const accounts = await Promise.all(sources.map(sourcePublicKey => horizon.loadAccount(sourcePublicKey)))

  return accounts.some(account => {
    const thisWalletSigner = account.signers.find(signer => signer.public_key === walletPublicKey)

    // requires another signature?
    return thisWalletSigner ? thisWalletSigner.weight < account.thresholds.high_threshold : true
  })
}
