const autoReload = require("electron-reload")
const path = require("path")

const webappDistDir = path.join(__dirname, "..", "dist")

autoReload(webappDistDir, { awaitWriteFinish: true })
