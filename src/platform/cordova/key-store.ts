import { createStore, KeysData } from "key-store"
import { PublicKeyData, PrivateKeyData } from "../types"
import { sendCommand } from "./message-handler"
import { commands } from "../../cordova/ipc"

async function readKeys(): Promise<KeysData<PublicKeyData>> {
  const event = await sendCommand(commands.readKeysCommand)
  return event.data.keys
}

async function saveKeys(keysData: KeysData<PublicKeyData>) {
  const event = await sendCommand(commands.storeKeysCommand, { keys: keysData })
  return event.data
}

export default async function createKeyStore() {
  const storeKeys = async (keysData: KeysData<PublicKeyData>) => {
    await saveKeys(keysData)
  }

  return createStore<PrivateKeyData, PublicKeyData>(storeKeys, await readKeys())
}
