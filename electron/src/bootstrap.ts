import { app } from "electron"
// Needs to match the value in electron-build.yml
app.setAppUserModelId("io.solarwallet.app")

app.setAsDefaultProtocolClient("web+stellar")
