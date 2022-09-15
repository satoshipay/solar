import AccountSettings from "./locales/th/account-settings.json"
import Account from "./locales/th/account.json"
import App from "./locales/th/app.json"
import AppSettings from "./locales/th/app-settings.json"
import CreateAccount from "./locales/th/create-account.json"
import Generic from "./locales/th/generic.json"
import Operations from "./locales/th/operations.json"
import Payment from "./locales/th/payment.json"
import Trading from "./locales/th/trading.json"
import TransferService from "./locales/th/transfer-service.json"

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
