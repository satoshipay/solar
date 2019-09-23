const { app, autoUpdater, Notification } = require("electron")
const isDev = require("electron-is-dev")
const fetch = require("isomorphic-fetch")
const { readInstallationID } = require("./storage")
const { URL } = require("url")

const updateEndpoint = !isDev ? "https://update.solarwallet.io/" : process.env.UPDATE_ENDPOINT

checkForUpdates().catch(console.error)

async function checkForUpdates() {
  if (!updateEndpoint) {
    return
  }

  const installationID = readInstallationID()
  const feedURL = new URL(`/update/${process.platform}/${app.getVersion()}`, updateEndpoint).toString()

  const headers = {
    "user-agent": `SatoshiPaySolar/${app.getVersion()}`,
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

    autoUpdater.checkForUpdates()
  }
}

function showUpdateNotification(version) {
  const notification = new Notification({
    title: `New version ${version} of Solar available`,
    subtitle: `Click to update.`
  })

  notification.show()

  return new Promise(resolve => {
    notification.on("click", () => resolve("click"))
  })
}
