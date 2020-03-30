import { Buffer } from "buffer"
import { createStore, KeysData } from "key-store"
import { Networks, Keypair, Transaction } from "stellar-sdk"
import { WrongPasswordError } from "~Generic/lib/errors"
import { Messages } from "~Shared/ipc"

type Depromisify<T> = T extends Promise<infer BaseT> ? BaseT : T

type CallHandlers = {
  [messageType in keyof IPC.MessageType]: IPC.MessageSignatures[messageType] extends (
    ...args: infer Args
  ) => infer Return
    ? (...args: Args) => Depromisify<Return> | Promise<Depromisify<Return>>
    : never
}

const callHandlers = {} as CallHandlers

export function call<Message extends keyof IPC.MessageType>(
  messageType: Message,
  ...args: IPC.MessageArgs<Message>
): Promise<IPC.MessageReturnType<Message>> {
  return new Promise<IPC.MessageReturnType<Message>>((resolve, reject) => {
    try {
      const handler = callHandlers[messageType]
      if (handler) {
        const result = (handler as any)(...(args as any))
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

export function subscribeToMessages<Message extends keyof IPC.MessageType>(
  messageType: Message,
  callback: (message: any) => void
): UnsubscribeFn {
  // subscribing to deep link urls is the only use case right now
  if (messageType === Messages.DeepLinkURL) {
    return subscribeToDeepLinkURLs(callback)
  } else {
    return () => undefined
  }
}

callHandlers[Messages.CopyToClipboard] = (text: string) => (navigator as any).clipboard.writeText(text)
callHandlers[Messages.OpenLink] = (href: string) => window.open(href, "_blank") as any

callHandlers[Messages.CheckUpdateAvailability] = () => false
callHandlers[Messages.StartUpdate] = () => undefined

callHandlers[Messages.NotificationPermission] = () => window.Notification.permission
callHandlers[Messages.RequestNotificationPermission] = async () =>
  Boolean(await window.Notification.requestPermission())
callHandlers[Messages.ShowNotification] = (localNotification: LocalNotification) => {
  return new Promise<void>(resolve => {
    const notification = new Notification(localNotification.title, { body: localNotification.text })

    notification.addEventListener("click", () => {
      resolve()
      notification.close()
    })
  })
}

const defaultTestingKeys: KeysData<KeyStoreAccountV1.PublicKeyData> = {
  "1": {
    metadata: {
      nonce: "19sHNxecdiik6chwGFgZVk9UJoG2k8B+",
      iterations: 10000
    },
    public: {
      version: 1,
      name: "Test account",
      password: false,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true,
      txAuth: KeyStoreAccountV1.TxAuthPolicy.Unprotected
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
      version: 1,
      name: "Test account with password",
      password: true,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true,
      txAuth: KeyStoreAccountV1.TxAuthPolicy.AlwaysPassword
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
      version: 1,
      name: "Multisig Account",
      password: false,
      publicKey: "GDNVDG37WMKPEIXSJRBAQAVPO5WGOPKZRZZBPLWXULSX6NQNLNQP6CFF",
      testnet: true,
      txAuth: KeyStoreAccountV1.TxAuthPolicy.Unprotected
    },
    private:
      "XFZM+iKm5YM6v2KdABGyczb9D51IdFPM3ibRhrVGfMonOKV8dVKvqC9JA1ylfcbEpzUaIUwPBjAxk7SIgcGhtjrqenp0Bj1QPqZwSWmAB5q5pfb5aLTdwVc="
  }
}

initKeyStore()
initSettings()

function createHexNonce() {
  const nonceBuffer = Buffer.allocUnsafe(16)
  crypto.getRandomValues(nonceBuffer)
  return nonceBuffer.toString("hex")
}

async function hashAppPassword(password: string, hexNonce: string) {
  const passwordHashArrayBuffer = await crypto.subtle.digest("SHA-256", Buffer.from(hexNonce + password, "utf-8"))
  const passwordHashHex = new Buffer(passwordHashArrayBuffer).toString("hex")
  return passwordHashHex
}

function initKeyStore() {
  const appKeys = localStorage.getItem("solar:app-keys")
  const keys = localStorage.getItem("solar:keys")

  const initialAppKeys = appKeys ? JSON.parse(appKeys) : {}
  const initialKeys = keys ? JSON.parse(keys) : defaultTestingKeys

  function saveAppKeys(keysData: KeysData<KeyStoreAppKey.AppKeyData>) {
    localStorage.setItem("solar:app-keys", JSON.stringify(keysData))
  }
  function saveKeys(keysData: KeysData<KeyStoreAccountV1.PublicKeyData>) {
    localStorage.setItem("solar:keys", JSON.stringify(keysData))
  }

  const appKeyID = "$app"

  const appKeyStore = createStore<KeyStoreAccountV1.PrivateKeyData, KeyStoreAppKey.AppKeyData>(
    saveAppKeys,
    initialAppKeys
  )
  const keyStore = createStore<KeyStoreAccountV1.PrivateKeyData, KeyStoreAccountV1.PublicKeyData>(saveKeys, initialKeys)

  async function authorize(password: string) {
    if (appKeyStore.getKeyIDs().indexOf(appKeyID) === -1) {
      return
    }

    const publicData = appKeyStore.getPublicKeyData(appKeyID)
    const hash = await hashAppPassword(password, publicData.nonce)

    if (hash !== publicData.passwordHash) {
      throw WrongPasswordError("Wrong password.")
    }
  }

  callHandlers[Messages.CreateKey] = async (keyID, password, privateKey, options) => {
    const publicData: KeyStoreAccountV1.PublicKeyData = {
      ...options,
      password: Boolean(password),
      version: 1
    }
    await keyStore.saveKey(keyID, password, { privateKey }, publicData)
  }
  callHandlers[Messages.GetAppKeyMetadata] = () => appKeyStore.getPublicKeyData(appKeyID)
  callHandlers[Messages.GetKeyIDs] = () => keyStore.getKeyIDs()
  callHandlers[Messages.GetPublicKeyData] = keyID => keyStore.getPublicKeyData(keyID)
  callHandlers[Messages.GetPrivateKey] = async (keyID, password) => {
    await authorize(password)
    return keyStore.getPrivateKeyData(keyID, password).privateKey
  }
  callHandlers[Messages.HasSetAppPassword] = () => appKeyStore.getKeyIDs().indexOf(appKeyID) > -1
  callHandlers[Messages.RemoveKey] = keyID => keyStore.removeKey(keyID)
  callHandlers[Messages.RenameKey] = async (keyID, newName) => {
    const publicData = keyStore.getPublicKeyData(keyID)
    await keyStore.savePublicKeyData(keyID, { ...publicData, name: newName })
  }
  callHandlers[Messages.SetUpAppPassword] = async (password, privateKey, authPolicy) => {
    const nonce = createHexNonce()
    const passwordHash = await hashAppPassword(password, nonce)

    const publicData: KeyStoreAppKey.AppKeyData = {
      authPolicy,
      nonce,
      passwordHash,
      version: 1
    }

    await appKeyStore.saveKey(appKeyID, password, { privateKey }, publicData)
  }
  callHandlers[Messages.SignTransaction] = signTransaction
  callHandlers[Messages.UpdateAppPassword] = async (newPassword, prevPassword, authPolicy) => {
    await authorize(prevPassword)

    const nonce = createHexNonce()
    const passwordHash = await hashAppPassword(newPassword, nonce)

    const publicData: KeyStoreAppKey.AppKeyData = {
      authPolicy,
      nonce,
      passwordHash,
      version: 1
    }

    const privateData = appKeyStore.getPrivateKeyData(appKeyID, prevPassword)
    await appKeyStore.saveKey(appKeyID, newPassword, privateData, publicData)
  }
  callHandlers[Messages.UpdateKeyPassword] = async (keyID, newPassword, prevPassword) => {
    const privateData = keyStore.getPrivateKeyData(keyID, prevPassword)
    const publicData = keyStore.getPublicKeyData(keyID)

    if ("version" in publicData && publicData.version >= 1) {
      throw Error("Keys of v1+ accounts are not supposed to have distinct passwords.")
    }

    await keyStore.saveKey(keyID, newPassword, privateData, publicData)
  }
  callHandlers[Messages.UpdateKeyTxAuth] = async (keyID, authPolicy, password) => {
    await authorize(password || "")

    await keyStore.savePublicKeyData(keyID, {
      ...keyStore.getPublicKeyData(keyID),
      txAuth: authPolicy
    })
  }

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
      throw WrongPasswordError()
    }
  }
}

function initSettings() {
  let settings: Platform.SettingsData = {
    agreedToTermsAt: "2019-01-17T07:34:05.688Z",
    biometricLock: false,
    multisignature: true,
    testnet: true,
    trustedServices: [],
    hideMemos: false
  }

  callHandlers[Messages.BioAuthAvailable] = () => ({ available: false, enrolled: false })

  callHandlers[Messages.ReadSettings] = () => settings
  callHandlers[Messages.StoreSettings] = (updatedSettings: Partial<Platform.SettingsData>) => {
    settings = {
      ...settings,
      ...updatedSettings
    }
    return true
  }

  callHandlers[Messages.ReadIgnoredSignatureRequestHashes] = () => {
    const data = window.localStorage.getItem("wallet:storage:ignoredSignatureRequests")
    return data ? JSON.parse(data) : []
  }

  callHandlers[Messages.StoreIgnoredSignatureRequestHashes] = (updatedSignatureRequestHashes: string[]) => {
    window.localStorage.setItem(
      "wallet:storage:ignoredSignatureRequests",
      JSON.stringify(updatedSignatureRequestHashes)
    )
    return true
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
