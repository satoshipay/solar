import {
  Account as StellarAccount,
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
import { Account } from "~App/contexts/accounts"
import { getNetwork } from "~Workers/net-worker/stellar-network"
import { workers } from "~Workers/worker-controller"
import { WrongPasswordError, CustomError } from "./errors"
import { applyTimeout } from "./promise"
import { getAllSources, isNotFoundError } from "./stellar"
import { MultisigTransactionResponse } from "./multisig-service"

/** in stroops */
const maximumFeeToSpend = 1_000_000

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

export function hasSigned(
  transaction: Transaction,
  publicKey: string,
  signatureRequest?: MultisigTransactionResponse | null
) {
  const signedAdditionallyBy = signatureRequest?.signed_by || []

  return (
    signedAdditionallyBy.indexOf(publicKey) > -1 ||
    transaction.signatures.some(signature => {
      const hint = signature.hint()
      const keypair = Keypair.fromPublicKey(publicKey)

      return hint.equals(keypair.rawPublicKey().slice(-hint.byteLength))
    })
  )
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

function selectTransactionTimeout(accountData: Pick<ServerApi.AccountRecord, "signers">): number {
  // Don't forget that we must give the user enough time to enter their password and click ok
  return accountData.signers.length > 1 ? 30 * 24 * 60 * 60 : 90
}

interface TxBlueprint {
  accountData: Pick<ServerApi.AccountRecord, "id" | "signers">
  memo?: Memo | null
  minTransactionFee?: number
  walletAccount: Account
}

export async function createTransaction(operations: Array<xdr.Operation<any>>, options: TxBlueprint) {
  const { walletAccount } = options
  const { netWorker } = await workers
  const network = getNetwork(walletAccount.testnet)

  const timeout = selectTransactionTimeout(options.accountData)

  const [accountMetadata, timebounds] = await Promise.all([
    applyTimeout(netWorker.fetchAccountData(walletAccount.accountID, network, 10), 10000, () =>
      fail(`Fetching source account data timed out`)
    ),
    applyTimeout(netWorker.fetchTimebounds(timeout, network), 10000, () =>
      fail(`Syncing time bounds with horizon timed out`)
    )
  ] as const)

  if (!accountMetadata) {
    throw Error(`Failed to query account from horizon server: ${walletAccount.publicKey}`)
  }

  const account = new StellarAccount(accountMetadata.id, accountMetadata.sequence)
  const networkPassphrase = getNetwork(walletAccount.testnet)
  const txFee = Math.max(options.minTransactionFee || 0, maximumFeeToSpend)

  const builder = new TransactionBuilder(account, {
    fee: String(txFee),
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

export async function requiresRemoteSignatures(network: Networks, transaction: Transaction, walletPublicKey: string) {
  const { netWorker } = await workers
  const sources = getAllSources(transaction)

  if (sources.length > 1) {
    return true
  }

  const accounts = await Promise.all(
    sources.map(async sourcePublicKey => {
      const account = await netWorker.fetchAccountData(sourcePublicKey, network)
      if (!account) {
        throw Error(`Could not fetch account metadata from horizon server: ${sourcePublicKey}`)
      }
      return account
    })
  )

  return accounts.some(account => {
    const thisWalletSigner = account.signers.find(signer => signer.key === walletPublicKey)

    // requires another signature?
    return thisWalletSigner
      ? thisWalletSigner.weight === 0 || thisWalletSigner.weight < account.thresholds.high_threshold
      : true
  })
}

/**
 * Checks remotely created transactions for potentially malicious content.
 *
 * Will return `true` if the transaction was created by an account not managed
 * by our local wallet, but containing operations that affect a locally
 * managed account (like sending funds from that local account).
 */
export function isPotentiallyDangerousTransaction(transaction: Transaction, trustedPublicKeys: string[]) {
  // check if there is a source account that is not trusted
  const dangerous = getAllSources(transaction).some(source => trustedPublicKeys.indexOf(source) === -1)
  return dangerous
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
