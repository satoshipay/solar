// tslint:disable-next-line: no-var-requires
const { ipcRenderer } = require("electron")
const electronProcess = process

let nextCommandID = 1

function createCommand<T>(commandType: string, eventType: string): () => Promise<T> {
  return (...args: any[]) => {
    const messageID = nextCommandID++

    const responsePromise = new Promise<T>((resolve, reject) => {
      const listener = (event: Electron.Event, data: any) => {
        if (data.messageID === messageID) {
          ipcRenderer.removeListener(eventType, listener)

          if (data.error) {
            const error = Object.assign(Error(data.error.message), {
              name: data.error.name || "Error",
              stack: data.error.stack
            })
            reject(error)
          } else if (data.result) {
            resolve(data.result)
          } else {
            resolve()
          }
        }
      }
      ipcRenderer.on(eventType, listener)
    })

    ipcRenderer.send(commandType, { messageID, args })
    return responsePromise
  }
}

const getKeyIDs = createCommand<string[]>("keystore:getKeyIDs", "keystore:keyIDs")
const getPublicKeyData = createCommand<PublicKeyData>("keystore:getPublicKeyData", "keystore:publicKeyData")
const getPrivateKeyData = createCommand<PrivateKeyData>("keystore:getPrivateKeyData", "keystore:privateKeyData")
const saveKey = createCommand<void>("keystore:saveKey", "keystore:savedKey")
const savePublicKeyData = createCommand<void>("keystore:savePublicKeyData", "keystore:savedPublicKeyData")
const signTransaction = createCommand<string>("keystore:signTransaction", "keystore:signedTransaction")
const removeKey = createCommand<void>("keystore:removeKey", "keystore:removedKey")

const readSettings = () => ipcRenderer.sendSync("storage:settings:readSync")
const updateSettings = (updatedSettings: Partial<SettingsData>) =>
  ipcRenderer.sendSync("storage:settings:storeSync", updatedSettings)

const readIgnoredSignatureRequestHashes = () => ipcRenderer.sendSync("storage:ignoredSignatureRequests:readSync")
const updateIgnoredSignatureRequestHashes = (updatedHashes: string[]) =>
  ipcRenderer.sendSync("storage:ignoredSignatureRequests:storeSync", updatedHashes)

const isUpdateAvailable = createCommand<boolean>("app-update:get-availability", "app-update:availability")
const startUpdate = createCommand<void>("app-update:start", "app-update:started")

const subscribeToIPCMain = (
  channel: string,
  subscribeCallback: (event: Event, ...args: any[]) => void
): (() => void) => {
  ipcRenderer.on(channel, subscribeCallback)
  const unsubscribe = () => ipcRenderer.removeListener(channel, subscribeCallback)
  return unsubscribe
}

const electron: ElectronContext = {
  getKeyIDs,
  getPublicKeyData,
  getPrivateKeyData,
  saveKey,
  savePublicKeyData,
  signTransaction,
  removeKey,

  readIgnoredSignatureRequestHashes,
  readSettings,
  updateIgnoredSignatureRequestHashes,
  updateSettings,
  subscribeToIPCMain,

  isUpdateAvailable,
  startUpdate
}

global.electron = window.electron = electron

process.once("loaded", () => {
  const newProcess = {
    env: electronProcess.env,
    pid: electronProcess.pid,
    platform: electronProcess.platform
  }

  global.process = window.process = newProcess as NodeJS.Process
})
