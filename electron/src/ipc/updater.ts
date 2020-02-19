import { dialog, Notification, app } from "electron"
import { autoUpdater, UpdateInfo } from "electron-updater"
import { Messages } from "../shared/ipc"
import { expose } from "./_ipc"

let updateInfo: UpdateInfo | null = null

autoUpdater.autoDownload = false

expose(Messages.CheckUpdateAvailability, async function updateAvailable() {
  if (!updateInfo) {
    const result = await autoUpdater.checkForUpdates()
    updateInfo = result.updateInfo
  }
  return app.getVersion().localeCompare(updateInfo.version) < 0
})

expose(Messages.StartUpdate, function startUpdate() {
  return startUpdating()
})

function showMessageBox(options: Electron.MessageBoxOptions) {
  return new Promise(resolve => dialog.showMessageBox(options, resolve))
}

async function startUpdating() {
  showMessageBox({ message: "Before downloadupdate()" })
  await autoUpdater.downloadUpdate()
  showMessageBox({ message: "After downloadupdate()" })
}

autoUpdater.once("update-available", (info: UpdateInfo) => {
  const notification = new Notification({
    title: `New version ${info.version} of Solar available`,
    body: "",
    subtitle: `Click to update.`
  })

  notification.show()

  notification.once("click", () => {
    autoUpdater.downloadUpdate()
    notification.close()
  })
})

autoUpdater.on("download-progress", progressInfo => {
  showMessageBox({ message: "Downloadprogress: " + progressInfo.percent })
})

autoUpdater.once("update-downloaded", async () => {
  showMessageBox({ message: "Update-Downloaded event fired" })

  const response = await showMessageBox({
    type: "info",
    buttons: ["Restart", "Later"],
    cancelId: 1,
    defaultId: 0,
    title: "Restart the Solar app",
    message: "Solar needs to quit and re-open to apply the update."
  })

  if (response === 0) {
    autoUpdater.quitAndInstall()
  }
})

// tslint:disable-next-line: no-console
autoUpdater.on("error", console.error)
autoUpdater.on("error", error => showMessageBox({ message: String(error) }))

autoUpdater.checkForUpdatesAndNotify()
