export const allAccounts = () => "/"
export const qrScanner = () => "/qr-scanner"
export const account = (accountID: string) => `/account/${accountID}`

export const isAccountRoutePath = (routePath: string) => routePath.startsWith("/account/")
