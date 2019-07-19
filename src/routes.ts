import { matchesRoute } from "./lib/routes"

export const allAccounts = () => "/"
export const account = (accountID: string) => `/account/${accountID}`
export const accountSettings = (accountID: string) => `/account/${accountID}/settings`
export const changeAccountPassword = (accountID: string) => `/account/${accountID}/settings/password`
export const createAccount = (testnet: boolean) => `/account/create/${testnet ? "testnet" : "mainnet"}`
export const createPayment = (accountID: string) => `/account/${accountID}/send`
export const deleteAccount = (accountID: string) => `/account/${accountID}/settings/delete`
export const exportSecretKey = (accountID: string) => `/account/${accountID}/settings/export`
export const receivePayment = (accountID: string) => `/account/${accountID}/receive`
export const manageAccountAssets = (accountID: string) => `/account/${accountID}/assets`
export const manageAccountSigners = (accountID: string) => `/account/${accountID}/signers`
export const settings = () => "/settings"
export const tradeAsset = (accountID: string) => `/account/${accountID}/trade`
export const withdrawAsset = (accountID: string) => `/account/${accountID}/withdraw`

export function routeUp(currentPath: string) {
  const match = currentPath.match(/^\/account\/([^\/]+)\/.+/)
  const accountID = match ? match[1] : undefined

  if (currentPath === "/") {
    return "/"
  } else if (currentPath.startsWith("/account/create/")) {
    return "/"
  } else if (accountID && matchesRoute(currentPath, "/account/*/settings/*", false)) {
    return accountSettings(accountID)
  } else if (accountID && matchesRoute(currentPath, "/account/*/*", false)) {
    return account(accountID)
  } else {
    return "/"
  }
}
