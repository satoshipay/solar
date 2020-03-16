import React from "react"
import { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { Keypair } from "stellar-sdk"
import { Account, AccountsContext } from "../../context/accounts"
import { AccountCreation, AccountCreationErrors } from "./types"

function isAccountAlreadyImported(privateKey: string, accounts: Account[]) {
  const publicKey = Keypair.fromSecret(privateKey).publicKey()
  return accounts.some(account => account.publicKey === publicKey)
}

function getNewAccountName(t: TFunction, accounts: Account[], testnet: boolean) {
  const baseName = testnet ? t("create-account.base-name.testnet") : t("create-account.base-name.mainnet")
  const deriveName = (idx: number) => (idx === 0 ? baseName : `${baseName} ${idx + 1}`)

  let index = 0

  // Find an account name that is not in use yet
  while (accounts.some(account => account.name === deriveName(index))) {
    index++
  }

  return deriveName(index)
}

function validateAccountCreation(t: TFunction, accounts: Account[], accountCreation: AccountCreation) {
  const errors: AccountCreationErrors = {}

  if (accountCreation.requiresPassword && !accountCreation.password) {
    errors.password = t("create-account.validation.no-password")
  } else if (accountCreation.requiresPassword && accountCreation.repeatedPassword !== accountCreation.password) {
    errors.password = t("create-account.validation.password-no-match")
  }

  if (accountCreation.import && !(accountCreation.secretKey || "").match(/^S[A-Z0-9]{55}$/)) {
    errors.secretKey = t("create-account.validation.invalid-key")
  } else if (accountCreation.import && isAccountAlreadyImported(accountCreation.secretKey!, accounts)) {
    errors.secretKey = t("create-account.validation.same-account")
  }

  return {
    errors,
    success: Object.keys(errors).length === 0
  }
}

interface UseAccountCreationOptions {
  import: boolean
  testnet: boolean
}

function useAccountCreation(options: UseAccountCreationOptions) {
  const { t } = useTranslation()
  const { accounts, createAccount } = React.useContext(AccountsContext)
  const [accountCreationErrors, setAccountCreationErrors] = React.useState<AccountCreationErrors>({})

  const [currentAccountCreation, setAccountCreation] = React.useState<AccountCreation>(() => ({
    import: options.import,
    multisig: false,
    name: getNewAccountName(t, accounts, options.testnet),
    password: "",
    repeatedPassword: "",
    requiresPassword: true,
    testnet: options.testnet
  }))

  const createNewAccount = async (accountCreation: AccountCreation) => {
    const keypair = accountCreation.import ? Keypair.fromSecret(accountCreation.secretKey!) : Keypair.random()

    const account = await createAccount({
      name: accountCreation.name,
      keypair,
      password: accountCreation.requiresPassword ? accountCreation.password : null,
      testnet: options.testnet
    })

    return account
  }

  return {
    accountCreation: currentAccountCreation,
    accountCreationErrors,
    createAccount(blueprint: AccountCreation) {
      return createNewAccount(blueprint)
    },
    setAccountCreation,
    validateAccountCreation(accountCreation: AccountCreation) {
      const validationResult = validateAccountCreation(t, accounts, accountCreation)
      setAccountCreationErrors(validationResult.errors)
      return validationResult.success
    }
  }
}

export default useAccountCreation
