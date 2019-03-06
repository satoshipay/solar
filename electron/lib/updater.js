const { Notification } = require("electron")
const fetch = require("isomorphic-fetch")
const open = require("opn")
const pkg = require("../../package.json")

const owner = "satoshipay"
const repo = "solar"

checkForUpdates().catch(console.error)

async function checkForUpdates() {
  const release = await fetchLatestRelease(owner, repo)
  const releaseIsNewer = release.name.replace(/^v/, "") > pkg.version

  console.debug(`Latest release: ${release.name}`)

  const urlToOpen = selectURLToOpen(release)

  if (releaseIsNewer && Notification.isSupported()) {
    const notification = new Notification({
      title: `New version ${release.name} of Solar available`,
      subtitle: `Click to download the update.`
    })
    notification.on("click", () => open(urlToOpen))
    notification.show()
  }
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
