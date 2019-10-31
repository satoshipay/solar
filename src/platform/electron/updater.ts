let updateStarted = false

export function isUpdateStarted() {
  return updateStarted
}

export async function isUpdateAvailable() {
  if (window && window.electron) {
    return window.electron.isUpdateAvailable()
  } else {
    return false
  }
}

export async function startUpdate() {
  if (window && window.electron) {
    updateStarted = true
    await window.electron.startUpdate()
    updateStarted = false
  }
}
