interface Updater {
  isUpdateAvailable(): Promise<boolean>
  isUpdateStarted(): boolean
  startUpdate(): Promise<void>
}

export default function getUpdater(): Updater {
  if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    return require("./cordova/updater")
  } else if (window.electron) {
    return require("./electron/updater")
  } else if (process.browser) {
    return require("./web/updater")
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}
