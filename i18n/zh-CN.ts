import AccountSettings from "./locales/zh-CN/account-settings.json"
import Account from "./locales/zh-CN/account.json"
import AppSettings from "./locales/zh-CN/app-settings.json"
import CreateAccount from "./locales/zh-CN/create-account.json"
import Generic from "./locales/zh-CN/generic.json"
import Operations from "./locales/zh-CN/operations.json"

const translations = {
  "account-settings": AccountSettings,
  account: Account,
  "app-settings": AppSettings,
  "create-account": CreateAccount,
  generic: Generic,
  operations: Operations
} as const

export default translations
