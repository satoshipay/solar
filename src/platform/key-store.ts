import { KeyStore } from "key-store"
import { PrivateKeyData, PublicKeyData } from "./types"

const runningInElectron = () => Boolean(process.pid)

export default function getKeyStore(): KeyStore<PrivateKeyData, PublicKeyData> {
  if (runningInElectron()) {
    const createElectronKeyStore = require("./electron/key-store").default
    return createElectronKeyStore()
  } else if (process.browser) {
    const createBrowserKeyStore = require("./web/key-store").default
    return createBrowserKeyStore()
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}
