import AccountSettings from "./locales/en/account-settings.json"
import Account from "./locales/en/account.json"
import AppSettings from "./locales/en/app-settings.json"
import CreateAccount from "./locales/en/create-account.json"
import Generic from "./locales/en/generic.json"
import Operations from "./locales/en/operations.json"

const translations = {
  "account-settings": AccountSettings,
  account: Account,
  "app-settings": AppSettings,
  "create-account": CreateAccount,
  generic: Generic,
  operations: Operations
} as const

export default translations
