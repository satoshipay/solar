import { workers } from "~Workers/worker-controller"

export type CurrencyCode =
  | "USD"
  | "ALL"
  | "DZD"
  | "ARS"
  | "AMD"
  | "AUD"
  | "AZN"
  | "BHD"
  | "BDT"
  | "BYN"
  | "BMD"
  | "BOB"
  | "BAM"
  | "BRL"
  | "BGN"
  | "KHR"
  | "CAD"
  | "CLP"
  | "CNY"
  | "COP"
  | "CRC"
  | "HRK"
  | "CUP"
  | "CZK"
  | "DKK"
  | "DOP"
  | "EGP"
  | "EUR"
  | "GEL"
  | "GHS"
  | "GTQ"
  | "HNL"
  | "HKD"
  | "HUF"
  | "ISK"
  | "INR"
  | "IDR"
  | "IRR"
  | "IQD"
  | "ILS"
  | "JMD"
  | "JPY"
  | "JOD"
  | "KZT"
  | "KES"
  | "KWD"
  | "KGS"
  | "LBP"
  | "MKD"
  | "MYR"
  | "MUR"
  | "MXN"
  | "MDL"
  | "MNT"
  | "MAD"
  | "MMK"
  | "NAD"
  | "NPR"
  | "TWD"
  | "NZD"
  | "NIO"
  | "NGN"
  | "NOK"
  | "OMR"
  | "PKR"
  | "PAB"
  | "PEN"
  | "PHP"
  | "PLN"
  | "GBP"
  | "QAR"
  | "RON"
  | "RUB"
  | "SAR"
  | "RSD"
  | "SGD"
  | "ZAR"
  | "KRW"
  | "SSP"
  | "VES"
  | "LKR"
  | "SEK"
  | "CHF"
  | "THB"
  | "TTD"
  | "TND"
  | "TRY"
  | "UGX"
  | "UAH"
  | "AED"
  | "UYU"
  | "UZS"
  | "VND"

export interface QuoteRecord {
  price: number
  volume_24h: number
  percent_change_1h: number
  percent_change_24h: number
  percent_change_7d: number
  market_cap: number
  last_updated: string
}

export async function fetchCryptoPrice(currency: CurrencyCode, testnet: boolean): Promise<number> {
  const cacheKey = testnet ? `cryptocurrency-price:testnet:${currency}` : `cryptocurrency-price:mainnet:${currency}`
  const timestampCacheKey = `${cacheKey}:timestamp`

  const cachedCryptoPrice = localStorage.getItem(cacheKey)
  const timestamp = localStorage.getItem(timestampCacheKey)

  const { netWorker } = await workers

  if (cachedCryptoPrice && timestamp && +timestamp > Date.now() - 60 * 1000) {
    // use cached price if it is not older than 1 minute
    return JSON.parse(cachedCryptoPrice)
  } else {
    const cryptoPriceQuote = await netWorker.fetchCryptoPrice(currency, testnet)
    const cryptoPrice = cryptoPriceQuote.price
    localStorage.setItem(cacheKey, JSON.stringify(cryptoPrice))
    localStorage.setItem(timestampCacheKey, Date.now().toString())
    return cryptoPrice
  }
}
