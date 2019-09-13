const { Notification } = require("electron")
const fetch = require("isomorphic-fetch")
const open = require("opn")
const { URL } = require("url")
const pkg = require("../../package.json")
const { readInstallationID } = require("./storage")

const owner = "satoshipay"
const repo = "solar"

const updateEndpoint =
  process.env.NODE_ENV === "production" ? "https://update.solarwallet.io/" : process.env.UPDATE_ENDPOINT

checkForUpdates().catch(console.error)

async function checkForUpdates() {
  if (!updateEndpoint) {
    return
  }

  const update = await fetchUpdateMetadata(updateEndpoint)
  console.debug(update ? `Update available: ${update.version}` : `No update available`)

  if (!update) return

  const release = await fetchLatestRelease(owner, repo)
  const releaseIsNewer = release.name.replace(/^v/, "") > pkg.version

  const urlToOpen = selectURLToOpen(release)

  if (releaseIsNewer && Notification.isSupported()) {
    const notification = new Notification({
      title: `New version ${release.name} of Solar available`,
      subtitle: `Click to download the update.`
    })
    notification.on("click", () => {
      open("https://solarwallet.io/downloading?download=false")
      open(urlToOpen)
    })
    notification.show()
  }
}

async function fetchUpdateMetadata(endpointURL) {
  const url = new URL(`/update/${process.platform}/${pkg.version}`, endpointURL).toString()
  const updateResponse = await fetch(url, {
    headers: {
      "User-Agent": `SatoshiPaySolar/${pkg.version}`,
      "X-Installation": await readInstallationID()
    }
  })

  if (!updateResponse.ok) {
    throw new Error(
      `Could not fetch latest release data from GitHub. ` + `Request failed with status ${releaseResponse.status}.`
    )
  }

  return updateResponse.status === 204 ? undefined : updateResponse.json()
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
