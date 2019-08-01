import { createStore, KeysData } from "key-store"
import { Keypair, Network, Transaction } from "stellar-sdk"
import { Account } from "../../context/accounts"
import { KeyStoreAPI } from "../types"

const defaultTestingKeys: KeysData<PublicKeyData> = {
  "1": {
    metadata: {
      nonce: "19sHNxecdiik6chwGFgZVk9UJoG2k8B+",
      iterations: 10000
    },
    public: {
      name: "Test account",
      password: false,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true
    },
    private:
      "F6SxXmjdLgxPI3msiNWZ7RGHoBwYEdFICLHJqzIZOADn71lfBYFD/qvQxcD9L1Wq495cDek0RlNLGF2fNK8P48A+B7Hfk8hWL+o5EbPd1ql20r7SfxVh9o0="
  },
  "2": {
    metadata: {
      nonce: "PvRwEZlBBIdwo3BPrPCxMpjsxmDbQI1r",
      iterations: 10000
    },
    public: {
      name: "Test account with password",
      password: true,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true
    },
    private:
      "5VzbN/Y5S1CfizJnnIejm8ku4KsG5cPvRht6BoZ8HalOOKdOt66Ra/rjoNlMbh45Et+25iGggzj+IlFvpepmuaEFcdqj5myEJspcy4GGwn+9TtA+KmUDcRI="
  },
  "3": {
    metadata: {
      nonce: "ChxQagEiuX/R98SEtdL/vT8HiebThI5X",
      iterations: 10000
    },
    public: {
      name: "Multisig Account",
      password: false,
      publicKey: "GDNVDG37WMKPEIXSJRBAQAVPO5WGOPKZRZZBPLWXULSX6NQNLNQP6CFF",
      testnet: true
    },
    private:
      "XFZM+iKm5YM6v2KdABGyczb9D51IdFPM3ibRhrVGfMonOKV8dVKvqC9JA1ylfcbEpzUaIUwPBjAxk7SIgcGhtjrqenp0Bj1QPqZwSWmAB5q5pfb5aLTdwVc="
  }
}

function saveKeys(keysData: KeysData<PublicKeyData>) {
  localStorage.setItem("solar:keys", JSON.stringify(keysData))
}

export default async function createKeyStore(): Promise<KeyStoreAPI> {
  const keys = localStorage.getItem("solar:keys")

  const initialKeys = keys ? JSON.parse(keys) : defaultTestingKeys
  const keyStore = createStore<PrivateKeyData, PublicKeyData>(saveKeys, initialKeys)

  return {
    getKeyIDs: async () => keyStore.getKeyIDs(),
    getPublicKeyData: async (...args) => keyStore.getPublicKeyData(...args),
    getPrivateKeyData: async (...args) => keyStore.getPrivateKeyData(...args),
    removeKey: async keyID => keyStore.removeKey(keyID),
    saveKey: async (...args) => keyStore.saveKey(...args),
    savePublicKeyData: async (...args) => keyStore.savePublicKeyData(...args),
    async signTransaction(tx: Transaction, account: Account, password: string): Promise<Transaction> {
      if (account.testnet) {
        Network.useTestNetwork()
      } else {
        Network.usePublicNetwork()
      }

      const { privateKey } = keyStore.getPrivateKeyData(account.id, password)
      const keypair = Keypair.fromSecret(privateKey)

      const signedTx = new Transaction((tx.toEnvelope().toXDR("base64") as unknown) as string)
      signedTx.sign(keypair)

      return signedTx
    }
  }
}
