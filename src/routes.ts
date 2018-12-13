export const allAccounts = () => "/"
export const account = (accountID: string) => `/account/${accountID}`
export const accountAssets = (accountID: string) => `/account/${accountID}/assets`
export const createAccount = (testnet: boolean) => `/account/create/${testnet ? "testnet" : "mainnet"}`
export const manageAccountSigners = (accountID: string) => `/account/${accountID}/signers`
export const settings = () => "/settings"
