import { app, autoUpdater, dialog, Notification } from "electron"
import isDev from "electron-is-dev"
import fetch from "isomorphic-fetch"
import os from "os"
import { URL } from "url"
import { expose } from "./_ipc"
import { readInstallationID } from "./storage"
import { Messages } from "../shared/ipc"

interface UpdateInfo {
  name: string
  notes: string
  pub_date: string
  url: string
}

const updateEndpoint = !isDev ? "https://update.solarwallet.io/" : process.env.UPDATE_ENDPOINT

// tslint:disable-next-line: no-console
checkForUpdates().catch(console.error)

expose(Messages.CheckUpdateAvailability, async function updateAvailable() {
  const updateInfo = await fetchUpdateInfo()
  return Boolean(updateInfo)
})

expose(Messages.StartUpdate, function startUpdate() {
  return startUpdatingWithoutInfo()
})

function getUpdaterOptions() {
  const installationID = readInstallationID()
  const url = new URL(`/update/${process.platform}/${app.getVersion()}`, updateEndpoint).toString()

  const headers = {
    "user-agent": `SatoshiPaySolar/${app.getVersion()} ${os.platform()}/${os.release()}`,
    "x-user-staging-id": installationID
  }

  return { headers, url }
}

async function fetchUpdateInfo(): Promise<UpdateInfo | undefined> {
  if (!updateEndpoint) {
    return undefined
  }

  const { headers, url } = getUpdaterOptions()
  const response = await fetch(url, { headers })

  // will see status 204 if local version is latest
  const updateInfo = response.status === 200 ? await response.json() : undefined

  return updateInfo && updateInfo.name.replace(/^v/, "") >= app.getVersion() ? updateInfo : undefined
}

async function checkForUpdates() {
  const updateInfo = await fetchUpdateInfo()

  // tslint:disable-next-line: no-console
  console.debug(updateInfo ? `Update available: ${updateInfo.name}` : `No update available`)

  if (!updateInfo || !Notification.isSupported()) return

  autoUpdater.setFeedURL(getUpdaterOptions())

  const userAction = await showUpdateNotification(updateInfo.name)

  if (userAction === "click") {
    await startUpdating(updateInfo.name)
  }
}

async function startUpdatingWithoutInfo() {
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

  if (updateInfo) {
    await startUpdating(updateInfo.name)
  }
}

async function startUpdating(version: string) {
  const progressNotification = showProgressNotification(version)
  autoUpdater.checkForUpdates()

  await new Promise(resolve => {
    // will only be called on signed mac applications
    autoUpdater.once("update-downloaded", resolve)
  })

  progressNotification.close()

  const response = dialog.showMessageBoxSync({
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
