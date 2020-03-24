import {
  Asset,
  Keypair,
  Memo,
  Operation,
  Server,
  ServerApi,
  TransactionBuilder,
  Transaction,
  xdr,
  Networks
} from "stellar-sdk"
import { Account } from "~App/context/accounts"
import { WrongPasswordError, CustomError } from "./errors"
import { applyTimeout } from "./promise"
import { getAllSources, isNotFoundError, isSignedByAnyOf, selectSmartTransactionFee, SmartFeePreset } from "./stellar"

// See <https://github.com/stellar/go/issues/926>
const highFeePreset: SmartFeePreset = {
  capacityTrigger: 0.5,
  maxFee: 1_000_000,
  percentile: 90
}

// Use a relatively high fee in case there will be a lot of traffic
// on the network later when the tx will be submitted to the network
export const multisigMinimumFee = 10_000

export function createCheapTxID(transaction: Transaction | ServerApi.TransactionRecord): string {
  const source = "source" in transaction ? transaction.source : transaction.source_account
  const sequence = "sequence" in transaction ? transaction.sequence : transaction.source_account_sequence

  if (!source || !sequence) {
    throw CustomError(
      "BadTransactionError",
      `Bad transaction given. Expected a Transaction or TransactionRecord, but got: ${transaction}`,
      { transaction: transaction.hash.toString() }
    )
  }

  return `${source}:${sequence}`
}

function fail(message: string): never {
  throw Error(message)
}

export function hasSigned(transaction: Transaction, publicKey: string) {
  return transaction.signatures.some(signature => {
    const hint = signature.hint()
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
    if (isNotFoundError(error)) {
      return false
    } else {
      throw error
    }
  }
}

async function selectTransactionFeeWithFallback(horizon: Server, fallbackFee: number) {
  try {
    return await selectSmartTransactionFee(horizon, highFeePreset)
  } catch (error) {
    // Don't show error notification, since our horizon's endpoint is non-functional anyway
    // tslint:disable-next-line no-console
    console.error("Smart fee selection failed:", error)
    return fallbackFee
  }
}

function selectTransactionTimeout(accountData: Pick<ServerApi.AccountRecord, "signers">): number {
  // Don't forget that we must give the user enough time to enter their password and click ok
  return accountData.signers.length > 1 ? 30 * 24 * 60 * 60 * 1000 : 90
}

interface TxBlueprint {
  accountData: Pick<ServerApi.AccountRecord, "id" | "signers">
  horizon: Server
  memo?: Memo | null
  minTransactionFee?: number
  walletAccount: Account
}

export async function createTransaction(operations: Array<xdr.Operation<any>>, options: TxBlueprint) {
  const { horizon, walletAccount } = options
  const fallbackFee = 10000
  const timeout = selectTransactionTimeout(options.accountData)

  const [account, smartTxFee, timebounds] = await Promise.all([
    applyTimeout(horizon.loadAccount(walletAccount.publicKey), 10000, () =>
      fail(`Fetching source account data timed out`)
    ),
    applyTimeout(selectTransactionFeeWithFallback(horizon, fallbackFee), 5000, () => fallbackFee),
    applyTimeout(horizon.fetchTimebounds(timeout), 10000, () => fail(`Syncing time bounds with horizon timed out`))
  ])

  const networkPassphrase = walletAccount.testnet ? Networks.TESTNET : Networks.PUBLIC
  const txFee = Math.max(smartTxFee, options.minTransactionFee || 0)

  const builder = new TransactionBuilder(account, {
    fee: txFee,
    memo: options.memo || undefined,
    timebounds,
    networkPassphrase
  })

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
    throw CustomError(
      "NonExistentDestinationError",
      `Cannot pay in ${asset.code}$, since the destination account does not exist yet. Account creations always need to be done via XLM.`,
      { assetCode: asset.code }
    )
  }

  const operation = destinationAccountExists
    ? Operation.payment({ destination, amount, asset })
    : Operation.createAccount({ destination, startingBalance: amount })

  return operation as xdr.Operation<Operation.CreateAccount | Operation.Payment>
}

export async function signTransaction(transaction: Transaction, walletAccount: Account, password: string | null) {
  if (walletAccount.requiresPassword && !password) {
    throw WrongPasswordError()
  }

  const signedTransaction = walletAccount.signTransaction(transaction, password)
  return signedTransaction
}

export async function requiresRemoteSignatures(horizon: Server, transaction: Transaction, walletPublicKey: string) {
  const sources = getAllSources(transaction)

  if (sources.length > 1) {
    return true
  }

  const accounts = await Promise.all(sources.map(sourcePublicKey => horizon.loadAccount(sourcePublicKey)))

  return accounts.some(account => {
    const thisWalletSigner = account.signers.find(signer => signer.key === walletPublicKey)

    // requires another signature?
    return thisWalletSigner ? thisWalletSigner.weight < account.thresholds.high_threshold : true
  })
}

/**
 * Checks remotely created transactions for potentially malicious content.
 *
 * Will return `true` if the transaction was created by an account not managed
 * by our local wallet, but containing operations that affect a locally
 * managed account (like sending funds from that local account).
 */
export function isPotentiallyDangerousTransaction(
  transaction: Transaction,
  localAccounts: Array<Pick<ServerApi.AccountRecord, "id" | "signers">>
) {
  const allTxSources = getAllSources(transaction)
  const localAffectedAccounts = localAccounts.filter(account => allTxSources.indexOf(account.id) > -1)

  const isSignedByLocalAccount = transaction.signatures.some(signature =>
    isSignedByAnyOf(
      signature,
      localAccounts.map(account => account.id)
    )
  )

  // Co-signers of local accounts
  const knownCosigners = localAffectedAccounts.reduce(
    (signers, affectedAccountData) => [...signers, ...affectedAccountData.signers],
    [] as ServerApi.AccountRecord["signers"]
  )
  const isSignedByKnownCosigner = transaction.signatures.some(signature =>
    isSignedByAnyOf(
      signature,
      knownCosigners.map(cosigner => cosigner.key)
    )
  )

  return localAffectedAccounts.length > 0 && !isSignedByLocalAccount && !isSignedByKnownCosigner
}

export function isStellarWebAuthTransaction(transaction: Transaction) {
  const firstOperation = transaction.operations[0]

  return (
    String(transaction.sequence) === "0" &&
    firstOperation &&
    firstOperation.type === "manageData" &&
    firstOperation.name.match(/ auth$/i)
  )
}
