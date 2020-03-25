import { subscribeToMessages } from "./ipc"
import { Messages } from "../../shared/ipc"

export function subscribeToDeepLinkURLs(callback: (url: string) => void) {
  return subscribeToMessages(Messages.DeepLinkURL, callback)
}
