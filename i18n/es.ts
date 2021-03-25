import AccountSettings from "./locales/es/account-settings.json"
import Account from "./locales/es/account.json"
import App from "./locales/es/app.json"
import AppSettings from "./locales/es/app-settings.json"
import CreateAccount from "./locales/es/create-account.json"
import Generic from "./locales/es/generic.json"
import Operations from "./locales/es/operations.json"
import Payment from "./locales/es/payment.json"
import Trading from "./locales/es/trading.json"
import TransferService from "./locales/es/transfer-service.json"

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
