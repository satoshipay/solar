import { createStore, KeysData } from "key-store"
import { Networks, Keypair, Transaction } from "stellar-sdk"

type CallHandler = (...args: any) => any

interface CallHandlers {
  [messageType: string]: CallHandler
}

const callHandlers: CallHandlers = {}

initKeyStore()
initSettings()

callHandlers[IPC.Messages.CopyToClipboard] = (text: string) => (navigator as any).clipboard.writeText(text)
callHandlers[IPC.Messages.OpenLink] = (href: string) => window.open(href, "_blank")

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

function initKeyStore() {
  const keys = localStorage.getItem("solar:keys")

  const initialKeys = keys ? JSON.parse(keys) : defaultTestingKeys
  function saveKeys(keysData: KeysData<PublicKeyData>) {
    localStorage.setItem("solar:keys", JSON.stringify(keysData))
  }
  const keyStore = createStore<PrivateKeyData, PublicKeyData>(saveKeys, initialKeys)

  callHandlers[IPC.Messages.GetKeyIDs] = keyStore.getKeyIDs
  callHandlers[IPC.Messages.GetPublicKeyData] = keyStore.getPublicKeyData
  callHandlers[IPC.Messages.GetPrivateKeyData] = keyStore.getPrivateKeyData
  callHandlers[IPC.Messages.RemoveKey] = keyStore.removeKey
  callHandlers[IPC.Messages.SaveKey] = keyStore.saveKey
  callHandlers[IPC.Messages.SavePublicKeyData] = keyStore.savePublicKeyData

  function signTransaction(internalAccountID: string, transactionXDR: string, password: string) {
    try {
      const account = keyStore.getPublicKeyData(internalAccountID)
      const networkPassphrase = account.testnet ? Networks.TESTNET : Networks.PUBLIC
      const transaction = new Transaction(transactionXDR, networkPassphrase)

      const privateKey = keyStore.getPrivateKeyData(internalAccountID, password).privateKey

      transaction.sign(Keypair.fromSecret(privateKey))

      return transaction
        .toEnvelope()
        .toXDR()
        .toString("base64")
    } catch (error) {
      throw Object.assign(new Error("Wrong password."), { name: "WrongPasswordError" })
    }
  }

  callHandlers[IPC.Messages.SignTransaction] = signTransaction
}

function initSettings() {
  let settings: Platform.SettingsData = {
    agreedToTermsAt: "2019-01-17T07:34:05.688Z",
    biometricLock: false,
    multisignature: true,
    testnet: true,
    hideMemos: false
  }

  callHandlers[IPC.Messages.BioAuthAvailable] = () => false

  callHandlers[IPC.Messages.ReadSettings] = () => settings
  callHandlers[IPC.Messages.StoreSettings] = (updatedSettings: Partial<Platform.SettingsData>) => {
    settings = {
      ...settings,
      ...updatedSettings
    }
  }

  callHandlers[IPC.Messages.ReadIgnoredSignatureRequestHashes] = () => {
    const data = window.localStorage.getItem("wallet:storage:ignoredSignatureRequests")
    return data ? JSON.parse(data) : []
  }

  callHandlers[IPC.Messages.StoreIgnoredSignatureRequestHashes] = (updatedSignatureRequestHashes: string[]) => {
    window.localStorage.setItem(
      "wallet:storage:ignoredSignatureRequests",
      JSON.stringify(updatedSignatureRequestHashes)
    )
  }
}

function subscribeToDeepLinkURLs(callback: (url: string) => void) {
  window.navigator.registerProtocolHandler(
    "web+stellar",
    `${window.location.origin}/?uri=%s`,
    "Stellar request handler"
  )

  // check if a stellar uri has been passed already
  const uri = new URLSearchParams(window.location.search).get("uri")
  if (uri) {
    callback(uri)
  }

  // no way to unsubscribe
  return () => undefined
}

export function call<Message extends IPC.Messages>(
  messageType: Message,
  ...args: IPC.MessageArgs<Message>
): Promise<IPC.MessageReturnType<Message>> {
  return new Promise<IPC.MessageReturnType<Message>>((resolve, reject) => {
    try {
      const handler = callHandlers[messageType]
      if (handler) {
        const result = handler(args)
        resolve(result)
      } else {
        reject(`No handler for ${messageType} found.`)
      }
    } catch (error) {
      reject(error)
    }
  })
}

type UnsubscribeFn = () => void

export function subscribeToMessages<Message extends IPC.Messages>(
  messageType: Message,
  callback: (message: any) => void
): UnsubscribeFn {
  // subscribing to deep link urls is the only use case right now
  if (messageType === IPC.Messages.DeepLinkURL) {
    return subscribeToDeepLinkURLs(callback)
  } else {
    return () => undefined
  }
}