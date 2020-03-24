import { app } from "electron"
import isDev from "electron-is-dev"
import Store from "electron-store"
import generateID from "nanoid/generate"
import * as path from "path"

// Use legacy path to not break backwards-compatibility
const storeDirectoryPath = path.join(app.getPath("appData"), "satoshipay-stellar-wallet")

// Use different key stores for development and production
export const mainStore = new Store({
  cwd: storeDirectoryPath,
  name: isDev ? "development" : "config"
})

export function readInstallationID() {
  if (!mainStore.has("installation-id")) {
    mainStore.set("installation-id", generateID("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 8))
  }
  return mainStore.get("installation-id")
}
