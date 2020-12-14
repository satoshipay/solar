import { call, subscribeToMessages } from "./ipc"
import { Messages } from "../../shared/ipc"

export function subscribeToDeepLinkURLs(callback: (url: string) => void) {
  return subscribeToMessages(Messages.DeepLinkURL, callback)
}

export function isDefaultProtocolClient() {
  return call(Messages.IsDefaultProtocolClient)
}

export function isDifferentHandlerInstalled() {
  return call(Messages.IsDifferentHandlerInstalled)
}

export function setAsDefaultProtocolClient() {
  return call(Messages.SetAsDefaultProtocolClient)
}
