import { commands } from "./cordova/ipc"

function handleSplashScreen() {
  if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    const listener = (event: Event) => {
      if (event instanceof MessageEvent && event.source === window.parent) {
        if (event.data === commands.hideSplashScreen) {
          hideSplashScreen()
        } else if (event.data === commands.showSplashScreen) {
          showSplashScreen()
        }
      }
    }

    window.addEventListener("message", listener, false)
  } else {
    hideSplashScreen()
  }
}

function hideSplashScreen() {
  setTimeout(() => {
    const splash = document.getElementById("splash")
    if (splash) {
      splash.style.opacity = "0"
      splash.style.pointerEvents = "none"

      setTimeout(() => {
        splash.style.display = "none"
      }, 1000)
    }
  }, 1000)
}

function showSplashScreen() {
  const splash = document.getElementById("splash")
  if (splash) {
    splash.removeAttribute("style")
  }
}

export default handleSplashScreen
