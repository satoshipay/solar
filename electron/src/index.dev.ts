import autoReload from "electron-reload"
import path from "path"

const watch = path.join(__dirname, "..", "..", "dist", "*")

autoReload(watch, {
  electron: path.join(__dirname, "..", "..", "node_modules", ".bin", "electron")
})

// tslint:disable-next-line: no-var-requires
require("./app")
