import { Messages } from "../shared/ipc"

const hideSplashScreenDelay = 500

function handleSplashScreen() {
  if (process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") {
    const listener = (event: Event) => {
      if (event instanceof MessageEvent && event.source === window.parent) {
        if (event.data === Messages.HideSplashScreen) {
          setTimeout(() => hideSplashScreen(), hideSplashScreenDelay)
        } else if (event.data === Messages.ShowSplashScreen) {
          showSplashScreen()
        }
      }
    }

    window.addEventListener("message", listener, false)
  }
}

function hideSplashScreen() {
  const splash = document.getElementById("splash")
  if (!splash) {
    return
  }

  splash.style.opacity = "0"
  splash.style.pointerEvents = "none"

  setTimeout(() => {
    splash.style.display = "none"
  }, 1000)
}

function showSplashScreen() {
  const splash = document.getElementById("splash")
  if (splash) {
    splash.removeAttribute("style")
  }
}

export default handleSplashScreen

export function appIsLoaded() {
  if ((process.env.PLATFORM === "android" || process.env.PLATFORM === "ios") && window.parent) {
    window.parent.postMessage("app:ready", "*")

    // Make sure that we definitely hide the splash screen and re-send app:ready in case there is
    // some race condition with the handler (Android users repeatedly reported eternal splash screens)
    setTimeout(() => {
      window.parent.postMessage("app:ready", "*")
      hideSplashScreen()
    }, 5000)
  } else {
    setTimeout(() => hideSplashScreen(), hideSplashScreenDelay)
  }
}
