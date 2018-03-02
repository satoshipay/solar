import { Asset, Keypair, Network, Operation, TransactionBuilder } from 'stellar-sdk'

function selectNetwork (testnet = false) {
  if (testnet) {
    Network.useTestNetwork()
  } else {
    Network.usePublicNetwork()
  }
}

async function accountExists (horizon, publicKey) {
  try {
    await horizon.accounts().accountId(publicKey).call()
    return true
  } catch (error) {
    // TODO
    return false
  }
}

export async function createTransaction ({ amount, destination, horizon, wallet, testnet = false }) {
  selectNetwork(testnet)

  const account = await horizon.loadAccount(wallet.publicKey)
  const tx = new TransactionBuilder(account).addOperation(
    await accountExists(destination)
      ? Operation.createAccount({ destination, startingBalance: amount })
      : Operation.payment({ destination, amount, asset: Asset.native() })
  ).build()

  return tx
}

export async function signTransaction (transaction, wallet, password = null) {
  transaction.sign(Keypair.fromSecret(await wallet.getPrivateKey(password)))
  return transaction
}
