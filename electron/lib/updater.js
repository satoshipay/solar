const { app, autoUpdater, dialog, Notification } = require("electron")
const isDev = require("electron-is-dev")
const fetch = require("isomorphic-fetch")
const os = require("os")
const { readInstallationID } = require("./storage")
const { URL } = require("url")

const showMessageBox = options => new Promise(resolve => dialog.showMessageBox(options, resolve))

const updateEndpoint = !isDev ? "https://update.solarwallet.io/" : process.env.UPDATE_ENDPOINT

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

  const updateAvailable = response.status === 200 // will see status 204 if local version is latest
  const updateInfo = response.status === 200 ? await response.json() : undefined

  console.debug(updateAvailable ? `Update available: ${updateInfo.name}` : `No update available`)

  if (!updateAvailable || !Notification.isSupported()) return

  const userAction = await showUpdateNotification(updateInfo.name)

  if (userAction === "click") {
    autoUpdater.setFeedURL(feedURL)
    autoUpdater.requestHeaders = {
      ...autoUpdater.requestHeaders,
      ...headers
    }

    await startUpdating(updateInfo.name)
  }
}

async function startUpdating(version) {
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

function showUpdateNotification(version) {
  const notification = new Notification({
    title: `New version ${version} of Solar available`,
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

function showProgressNotification(version) {
  const notification = new Notification({
    title: `Updating Solar…`,
    subtitle: `Download of ${version} in progress.`,
    silent: true
  })

  notification.show()
  return notification
}
