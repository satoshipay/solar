/**
 * Chinese translations.
 * Contributed by @fm612, reviewed by @Berniebaby.
 */

import AccountSettings from "./locales/zh/account-settings.json"
import Account from "./locales/zh/account.json"
import AppSettings from "./locales/zh/app-settings.json"
import CreateAccount from "./locales/zh/create-account.json"
import Generic from "./locales/zh/generic.json"
import Operations from "./locales/zh/operations.json"

const translations = {
  "account-settings": AccountSettings,
  account: Account,
  "app-settings": AppSettings,
  "create-account": CreateAccount,
  generic: Generic,
  operations: Operations
} as const

export default translations
