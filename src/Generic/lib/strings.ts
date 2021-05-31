export function max(strings: string[], leftpad?: string): string | undefined {
  if (leftpad) {
    const maxStringLength = Math.max(0, ...strings.map(str => str.length))
    strings = strings.map(str => str.padStart(maxStringLength, leftpad))
  }

  return strings.reduce<string | undefined>((maxValue, thisValue) => {
    return maxValue === undefined || thisValue > maxValue ? thisValue : maxValue
  }, undefined)
}

// replaces ',' with '.' in a string
// this can be used with strings that represent a number before passing them to Big()
export function replaceCommaWithDot(input: string) {
  return input.replace(/,/g, ".")
}

export const isValidAmount = (amount: string) => /^[0-9]+([\.,][0-9]+)?$/.test(amount)
