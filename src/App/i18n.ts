import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import translationEN from "../../i18n/en"
import translationES from "../../i18n/es"
import translationIT from "../../i18n/it"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === "development" ? true : false,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: translationEN
      },
      es: {
        translation: translationES
      },
      it: {
        translation: translationIT
      }
    }
  })

export default i18n
