import autoReload from "electron-reload"
import path from "path"

const webappDistDir = path.join(__dirname)

autoReload(webappDistDir, {
  electron: path.join(__dirname, "..", "..", "node_modules", ".bin", "electron")
})
