import { createStore, KeysData } from "key-store"
import { PublicKeyData, PrivateKeyData } from "../types"
import { sendCommand } from "./message-handler"

async function readKeys(): Promise<KeysData<PublicKeyData>> {
  const event = await sendCommand("storage:keys:read")
  return event.data.keys
}

async function saveKeys(keysData: KeysData<PublicKeyData>) {
  const event = await sendCommand("storage:keys:store", keysData)
  return event.data
}

export default async function createKeyStore() {
  const storeKeys = async (keysData: KeysData<PublicKeyData>) => {
    await saveKeys(keysData)
  }
  return createStore<PrivateKeyData, PublicKeyData>(storeKeys, await readKeys())
}
