import { app } from "electron"

// Quick-fix for "io.solarwallet.app" being shown in Mac app menu
app.name = "Solar Wallet"

// Needs to match the value in electron-build.yml
app.setAppUserModelId("io.solarwallet.app")
