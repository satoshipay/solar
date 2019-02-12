import { KeyStore } from "key-store"
import { PrivateKeyData, PublicKeyData } from "./types"

export default function getKeyStore(): KeyStore<PrivateKeyData, PublicKeyData> {
  if (window.electron) {
    const createElectronKeyStore = require("./electron/key-store").default
    return createElectronKeyStore()
  } else if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    const createCordovaKeyStore = require("./cordova/key-store").default
    return createCordovaKeyStore()
  } else if (process.browser) {
    const createBrowserKeyStore = require("./web/key-store").default
    return createBrowserKeyStore()
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}
