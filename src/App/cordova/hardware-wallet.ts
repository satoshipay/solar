import { Messages } from "../../../shared/ipc"
import { expose } from "./ipc"

export function registerUpdateHandler() {
  expose(Messages.GetHardwareWalletAccounts, () => [])
  expose(Messages.SignTransactionWithHardwareWallet, () =>
    Promise.reject("Cannot sign transaction of hardware wallet account on mobile.")
  )
}
