import AccountSettings from "./locales/it/account-settings.json"
import Account from "./locales/it/account.json"
import App from "./locales/it/app.json"
import AppSettings from "./locales/it/app-settings.json"
import CreateAccount from "./locales/it/create-account.json"
import Generic from "./locales/it/generic.json"
import Operations from "./locales/it/operations.json"
import Payment from "./locales/it/payment.json"
import Trading from "./locales/it/trading.json"
import TransferService from "./locales/it/transfer-service.json"

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
