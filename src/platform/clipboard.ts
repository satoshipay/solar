interface ClipboardFunctions {
  copyToClipboard(text: string): Promise<any>
}

const clipboard = getClipboardFunctions()

function getClipboardFunctions(): ClipboardFunctions {
  if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    return require("./cordova/clipboard")
  } else if (window.electron || process.browser) {
    return require("./web/clipboard")
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}

export function copyToClipboard(text: string) {
  return clipboard.copyToClipboard(text)
}
