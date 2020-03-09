import { app } from "electron"

// Needs to match the value in forge.config.js or the `name` in package.json
app.setAppUserModelId("io.solarwallet.app")

// Disabled until we actually ship SEP-7 support
// app.setAsDefaultProtocolClient("web+stellar")
