const isCommonAbbreviation = (str: string) => ["bic", "iban", "sepa", "swift"].indexOf(str) > -1
const uppercaseIfCommonAbbreviation = (str: string) => (isCommonAbbreviation(str) ? str.toUpperCase() : str)

const uppercaseFirstLetter = (str: string) => str[0].toUpperCase() + str.slice(1)

export function formatDescriptionText(description: string) {
  if (description === description.toLowerCase() || description === description.toUpperCase()) {
    description = uppercaseFirstLetter(description)
    description = description.replace(/\. ([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`)
    description = description.replace(/\b([A-Za-z]+)\b/g, match => uppercaseIfCommonAbbreviation(match))
  }
  return description
}

export function formatFieldDescription(description: string, isOptional: boolean, keepShort: boolean = false) {
  const formattedDescription = formatDescriptionText(description)
  const prefix = isOptional && !keepShort ? "(Optional) " : ""
  return prefix + formattedDescription
}

export function formatIdentifier(identifier: string) {
  return identifier
    .replace(/[-_]/g, " ")
    .split(" ")
    .map(word => uppercaseFirstLetter(word))
    .map(word => uppercaseIfCommonAbbreviation(word))
    .join(" ")
}
