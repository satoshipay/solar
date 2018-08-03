import { createStore } from "key-store"
import { ipcRenderer } from "electron"

export default function createKeyStore() {
  const readData = () => ipcRenderer.sendSync("storage:keys:readSync")
  const saveData = (data: any) => ipcRenderer.sendSync("storage:keys:storeSync", data)
  return createStore(saveData, readData())
}
