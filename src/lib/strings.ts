export function max(strings: string[], leftpad?: string): string | undefined {
  if (leftpad) {
    const maxStringLength = Math.max(0, ...strings.map(str => str.length))
    strings = strings.map(str => str.padStart(maxStringLength, leftpad))
  }

  return strings.reduce<string | undefined>((maxValue, thisValue) => {
    return maxValue === undefined || thisValue > maxValue ? thisValue : maxValue
  }, undefined)
}
