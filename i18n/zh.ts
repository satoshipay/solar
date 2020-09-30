/**
 * Chinese translations.
 * Contributed by @fm612, reviewed by @Berniebaby.
 */

import AccountSettings from "./locales/zh/account-settings.json"
import Account from "./locales/zh/account.json"
import App from "./locales/zh/app.json"
import AppSettings from "./locales/zh/app-settings.json"
import CreateAccount from "./locales/zh/create-account.json"
import Generic from "./locales/zh/generic.json"
import Operations from "./locales/zh/operations.json"
import Payment from "./locales/zh/payment.json"
import Trading from "./locales/zh/trading.json"
import TransferService from "./locales/zh/transfer-service.json"

const translations = {
  "account-settings": AccountSettings,
  account: Account,
  app: App,
  "app-settings": AppSettings,
  "create-account": CreateAccount,
  generic: Generic,
  operations: Operations,
  payment: Payment,
  trading: Trading,
  "transfer-service": TransferService
} as const

export default translations
