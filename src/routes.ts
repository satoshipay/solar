export const allAccounts = () => "/"
export const account = (accountID: string) => `/account/${accountID}`
export const accountSettings = (accountID: string) => `/account/${accountID}/settings`
export const createAccount = (testnet: boolean) => `/account/create/${testnet ? "testnet" : "mainnet"}`
export const createPayment = (accountID: string) => `/account/${accountID}/send`
export const deleteAccount = (accountID: string) => `/account/${accountID}/delete`
export const receivePayment = (accountID: string) => `/account/${accountID}/receive`
export const manageAccountAssets = (accountID: string) => `/account/${accountID}/assets`
export const manageAccountSigners = (accountID: string) => `/account/${accountID}/signers`
export const settings = () => "/settings"
export const tradeAsset = (accountID: string) => `/account/${accountID}/trade`
export const withdrawAsset = (accountID: string) => `/account/${accountID}/withdraw`

export function routeUp(currentPath: string) {
  const pathFragments = currentPath.split("/").filter(fragment => fragment.length > 0)
  const match = currentPath.match(/^\/account\/([^\/]+)\/.+/)
  const accountID = match ? match[1] : undefined

  if (currentPath === "/") {
    return "/"
  } else if (currentPath.startsWith("/account/create/")) {
    return "/"
  } else if (accountID && pathFragments.length > 2) {
    return account(accountID)
  } else if (accountID) {
    return "/"
  } else {
    return "/"
  }
}
