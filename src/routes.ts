export const allAccounts = () => "/"
export const qrScanner = () => "/qr-scanner"
export const account = (accountID: string) => `/account/${accountID}`
export const accountAssets = (accountID: string) => `/account/${accountID}/assets`

export const isAccountAssetsPath = (routePath: string) => routePath.match(/\/account\/[^\/]+\/assets/)
export const isAccountBasePath = (routePath: string) => routePath.match(/\/account\/[^\/]+\/?$/)
