import { Asset, Keypair, Network, Operation, Server, TransactionBuilder, Transaction } from 'stellar-sdk'
import { Wallet } from '../stores/wallets'

function selectNetwork (testnet = false) {
  if (testnet) {
    Network.useTestNetwork()
  } else {
    Network.usePublicNetwork()
  }
}

async function accountExists (horizon: Server, publicKey: string) {
  try {
    await horizon.accounts().accountId(publicKey).call()
    return true
  } catch (error) {
    // TODO
    return false
  }
}

interface TxBlueprint {
  amount: string,
  destination: string,
  horizon: Server,
  wallet: Wallet,
  testnet?: boolean
}

export async function createTransaction (options: TxBlueprint) {
  const { amount, destination, horizon, wallet, testnet = false } = options

  selectNetwork(testnet)

  const account = await horizon.loadAccount(wallet.publicKey)
  const tx = new TransactionBuilder(account).addOperation(
    await accountExists(horizon, destination)
      ? Operation.createAccount({ destination, startingBalance: amount })
      : Operation.payment({ destination, amount, asset: Asset.native() })
  ).build()

  return tx
}

export async function signTransaction (transaction: Transaction, wallet: Wallet, password: string | null = null) {
  transaction.sign(Keypair.fromSecret(await wallet.getPrivateKey(password)))
  return transaction
}
