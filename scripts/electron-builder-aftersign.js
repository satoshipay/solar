// See: https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db

const fs = require("fs")
const yaml = require("js-yaml")
const path = require("path")
const notarize = require("electron-notarize")

module.exports = async function(params) {
  // Only notarize the app on Mac OS only.
  if (process.platform !== "darwin") {
    return
  }

  if (!process.env.NOTARIZE || process.env.NOTARIZE.toLowerCase() === "false") {
    console.log("Skipping notarization. Set NOTARIZE=true to notarize the Mac app.")
    return
  }

  console.log("Running Mac aftersign hook...")

  const buildConfig = yaml.safeLoad(fs.readFileSync(require.resolve("../electron-build.yml"), "utf-8"))
  const appId = buildConfig.appId

  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)

  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`)
  }

  console.log(`Starting notarization of ${appId} at ${appPath}`)
  console.log(`This will likely take a while…`)

  await notarize.notarize({
    appBundleId: appId,
    appPath: appPath,
    appleId: process.env.APPLE_ID || fail("APPLE_ID has not been set."),
    appleIdPassword: process.env.APPLE_ID_PASSWORD || fail("APPLE_ID_PASSWORD has not been set.")
  })

  console.log(`Done notarizing ${appId}`)
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
