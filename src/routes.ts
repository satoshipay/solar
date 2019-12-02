import { matchesRoute } from "./lib/routes"

export const allAccounts = () => "/"
export const account = (accountID: string) => `/account/${accountID}`
export const accountSettings = (accountID: string) => `/account/${accountID}/settings`
export const assetDetails = (accountID: string, assetID: string) => `/account/${accountID}/balances/${assetID}`
export const balanceDetails = (accountID: string) => `/account/${accountID}/balances`
export const changeAccountPassword = (accountID: string) => `/account/${accountID}/settings/password`
export const createAccount = (testnet: boolean) => `/account/create/${testnet ? "testnet" : "mainnet"}`
export const createPayment = (accountID: string) => `/account/${accountID}/send`
export const deleteAccount = (accountID: string) => `/account/${accountID}/settings/delete`
export const depositAsset = (accountID: string) => `/account/${accountID}/deposit`
export const exportSecretKey = (accountID: string) => `/account/${accountID}/settings/export`
export const receivePayment = (accountID: string) => `/account/${accountID}/receive`
export const manageAccountAssets = (accountID: string) => `/account/${accountID}/balances/manage`
export const manageAccountSigners = (accountID: string) => `/account/${accountID}/settings/signers`
export const settings = () => "/settings"
export const withdrawAsset = (accountID: string) => `/account/${accountID}/withdraw`
export const showTransaction = (accountID: string, transactionHash: string) =>
  `/account/${accountID}/tx/${transactionHash}`

export const tradeAsset = (accountID: string, method?: "buy" | "sell") => {
  return method ? `/account/${accountID}/trade/${method}` : `/account/${accountID}/trade`
}

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
  } else if (accountID && matchesRoute(currentPath, "/account/*/tx/*", false)) {
    return account(accountID)
  } else if (accountID && currentPath === manageAccountAssets(accountID)) {
    return balanceDetails(accountID)
  } else {
    return "/"
  }
}
