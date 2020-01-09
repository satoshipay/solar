import React from "react"

const translations = {
  de: {},
  en: {
    "account-context-menu": {
      "account-settings-label": "Account Settings",
      "assets-and-balances-label": "Assets & Balances",
      "deposit-label": "Deposit",
      "trade-label": "Trade",
      "transactions-label": "Account Settings",
      "withdraw-label": "Withdraw"
    }
  }
}

type Language = keyof typeof translations
let currentLanguage: Language = getDefaultLanguage() || "en"

function getDefaultLanguage() {
  const lang = navigator.languages ? navigator.languages[0] : navigator.language
  const langShort = lang.substr(0, 2)

  const availableTranslations = Object.keys(translations)
  if (availableTranslations.indexOf(langShort) !== -1) {
    return langShort as Language
  } else {
    return null
  }
}

function createT(language: Language) {
  const translation = translations[language]

  const t = (key: string) => {
    const keys = key.split(".")
    const text = keys.reduce((obj: any, i) => {
      return obj[i]
    }, translation)

    return text || key
  }

  return t
}

export function useTranslation() {
  // wrap 't' in object since we can't have functions as state
  const [t, setT] = React.useState<{ t: (key: string) => string }>({ t: createT(currentLanguage) })

  const i18n = {
    changeLanguage: (newLanguage: Language) => (currentLanguage = newLanguage)
  }

  React.useEffect(() => {
    setT({ t: createT(currentLanguage) })
  }, [currentLanguage])

  return { t: t.t, i18n }
}
