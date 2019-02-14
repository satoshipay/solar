import { createStore } from "key-store"

export default async function createKeyStore() {
  if (!window.electron) {
    throw new Error("No electron runtime context available.")
  }
  return createStore(window.electron.updateKeys, window.electron.readKeys())
}
