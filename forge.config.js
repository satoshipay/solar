const path = require("path")

module.exports = {
  packagerConfig: {
    asar: true,
    // electron-packager automatically adds the right file extension for the platform
    icon: path.resolve(__dirname, "electron/build/icon"),
    ignore: shouldIgnoreFile,

    // macOS-specific options
    appBundleId: "io.solarwallet.app",
    appCategoryType: "public.app-category.finance",
    osxSign: {
      "entitlements-inherit": path.resolve(__dirname, "electron/build/entitlements.mac.inherit.plist"),
      "hardened-runtime": true
    },
    protocols: [
      {
        name: "Stellar SEP-0007 URI",
        schemes: ["web+stellar"]
      }
    ]
  },
  makers: [
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          categories: ["Finance"]
        }
      }
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        icon: path.resolve(__dirname, "electron/build/dmg.icns")
      }
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          categories: ["Finance"]
        }
      }
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {}
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"]
    }
  ]
}

function shouldIgnoreFile(filePath) {
  return (
    filePath &&
    path.dirname(filePath) !== "/" &&
    filePath !== "/LICENSE" &&
    !filePath.startsWith("/dist") &&
    !filePath.startsWith("/electron/build") &&
    !filePath.startsWith("/electron/lib") &&
    !filePath.startsWith("/node_modules")
  )
}
