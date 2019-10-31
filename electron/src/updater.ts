import { app, autoUpdater, dialog, Notification } from "electron"
import isDev from "electron-is-dev"
import fetch from "isomorphic-fetch"
import os from "os"
import { readInstallationID } from "./storage"
import { URL } from "url"

const showMessageBox = (options: Electron.MessageBoxOptions) =>
  new Promise(resolve => dialog.showMessageBox(options, resolve))

const updateEndpoint = !isDev ? "https://update.solarwallet.io/" : process.env.UPDATE_ENDPOINT

// tslint:disable-next-line: no-console
checkForUpdates().catch(console.error)

async function checkForUpdates() {
  if (!updateEndpoint) {
    return
  }

  const installationID = readInstallationID()
  const feedURL = new URL(`/update/${process.platform}/${app.getVersion()}`, updateEndpoint).toString()

  const headers = {
    "user-agent": `SatoshiPaySolar/${app.getVersion()} ${os.platform()}/${os.release()}`,
    "x-user-staging-id": installationID
  }

  const response = await fetch(feedURL, { headers })

  // will see status 204 if local version is latest
  const updateInfo = response.status === 200 ? await response.json() : undefined

  // tslint:disable-next-line: no-console
  console.debug(updateInfo ? `Update available: ${updateInfo.name}` : `No update available`)

  if (!updateInfo || updateInfo.name.replace(/^v/, "") < app.getVersion() || !Notification.isSupported()) return

  const userAction = await showUpdateNotification(updateInfo.name)

  if (userAction === "click") {
    const feedURLOptions: Electron.FeedURLOptions = { url: feedURL, headers }
    autoUpdater.setFeedURL(feedURLOptions)

    await startUpdating(updateInfo.name)
  }
}

async function startUpdating(version: string) {
  const progressNotification = showProgressNotification(version)
  autoUpdater.checkForUpdates()

  await new Promise(resolve => {
    autoUpdater.once("update-downloaded", resolve)
  })

  progressNotification.close()

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
}

function showUpdateNotification(version: string) {
  const notification = new Notification({
    title: `New version ${version} of Solar available`,
    body: "",
    subtitle: `Click to update.`
  })

  notification.show()

  return new Promise(resolve => {
    notification.once("click", () => {
      notification.close()
      resolve("click")
    })
  })
}

function showProgressNotification(version: string) {
  const notification = new Notification({
    title: `Updating Solar…`,
    subtitle: `Download of ${version} in progress.`,
    body: "",
    silent: true
  })

  notification.show()
  return notification
}
