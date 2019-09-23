const { app, Notification } = require("electron")
const fetch = require("isomorphic-fetch")
const open = require("opn")
const { readInstallationID } = require("./storage")
const { URL } = require("url")

const owner = "satoshipay"
const repo = "solar"

const updateEndpoint =
  process.env.NODE_ENV === "production" ? "https://update.solarwallet.io/" : process.env.UPDATE_ENDPOINT

checkForUpdates().catch(console.error)

async function checkForUpdates() {
  if (!updateEndpoint) {
    return
  }

  const installationID = readInstallationID()
  const feedURL = new URL(`/update/${process.platform}/${/*app.getVersion()*/ "0.20.0"}`, updateEndpoint).toString()

  const headers = {
    "user-agent": `SatoshiPaySolar/${app.getVersion()}`,
    "x-user-staging-id": installationID
  }

  const response = await fetch(feedURL, { headers })

  const updateAvailable = response.status === 200 // will see status 204 if local version is latest
  const updateInfo = response.status === 200 ? await response.json() : undefined

  console.debug(updateAvailable ? `Update available: ${updateInfo.version}` : `No update available`)

  if (!updateAvailable || !Notification.isSupported()) return

  const release = await fetchLatestRelease(owner, repo)
  const urlToOpen = selectURLToOpen(release)

  showUpdateNotification(release.name, urlToOpen)
}

async function fetchLatestRelease(owner, repo) {
  const releaseResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`)

  if (!releaseResponse.ok) {
    throw new Error(
      `Could not fetch latest release data from GitHub. ` + `Request failed with status ${releaseResponse.status}.`
    )
  }

  return releaseResponse.json()
}

function selectURLToOpen(releaseData) {
  const downloadURLs = releaseData.assets.map(asset => asset.browser_download_url)

  if (process.platform === "darwin") {
    const dmgURL = downloadURLs.find(url => url.match(/\.dmg$/i))
    return dmgURL || releaseData.html_url
  } else if (process.platform === "win32") {
    const exeURL = downloadURLs.find(url => url.match(/\.exe$/i))
    return exeURL || releaseData.html_url
  } else {
    return releaseData.html_url
  }
}

function showUpdateNotification(version, urlToOpen) {
  const notification = new Notification({
    title: `New version ${version} of Solar available`,
    subtitle: `Click to download the update.`
  })

  notification.on("click", () => {
    open("https://solarwallet.io/downloading?download=false")
    open(urlToOpen)
  })

  notification.show()
}
