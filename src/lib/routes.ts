export const allWallets = () => '/'
export const qrScanner = () => '/qr-scanner'
export const wallet = (walletID: string) => `/wallet/${walletID}`

export const isWalletRoutePath = (routePath: string) => routePath.startsWith('/wallet/')
