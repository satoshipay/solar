export const allAccounts = () => "/"
export const account = (accountID: string) => `/account/${accountID}`
export const createAccount = (testnet: boolean) => `/account/create/${testnet ? "testnet" : "mainnet"}`
export const createPayment = (accountID: string) => `/account/${accountID}/send`
export const receivePayment = (accountID: string) => `/account/${accountID}/receive`
export const manageAccountAssets = (accountID: string) => `/account/${accountID}/assets`
export const manageAccountSigners = (accountID: string) => `/account/${accountID}/signers`
export const settings = () => "/settings"
export const tradeAsset = (accountID: string, assetCode: string) => `/account/${accountID}/assets/${assetCode}`
