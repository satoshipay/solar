interface LinkFunctions {
  openLink(href: string): void
}

const Weblinks = getLinkFunctions()

function getLinkFunctions(): LinkFunctions {
  if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    return require("./cordova/links")
  } else if (window.electron || process.browser) {
    return require("./web/links")
  } else {
    throw new Error("There is no implementation for your platform.")
  }
}

export function openLink(href: string) {
  return Weblinks.openLink(href)
}
