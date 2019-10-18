import autoReload from "electron-reload"
import path from "path"

const webappDistDir = path.join(__dirname, "..", "lib")

autoReload(webappDistDir, { forceHardReset: true })
