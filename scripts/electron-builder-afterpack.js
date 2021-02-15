const fs = require("fs")
const path = require("path")

const appDir = path.join(__dirname, "../electron/dist/linux-unpacked/")

// Change permissions of the `chrome-sandbox` binary to 4755 to fix issues on some linux distributions
module.exports = async function(context) {
  const platform = context.packager.platform.name
  // Only change permissions of `chrome-sandbox` on linux
  if (platform !== "linux") {
    return
  }

  console.log("Running linux afterpack hook...")
  updateSandboxHelperPermissions(appDir)
}

async function sandboxHelperPath(appDir) {
  const helperPath = path.join(appDir, "chrome-sandbox")
  if (fs.existsSync(helperPath)) {
    return helperPath
  }
}

async function updateSandboxHelperPermissions(appDir) {
  const helperPath = await sandboxHelperPath(appDir)
  if (typeof helperPath !== "undefined") {
    console.log("Changing permissions of " + helperPath + " to 4755...")
    return fs.chmodSync(helperPath, 0o4755)
  }
}
