export function max(strings: string[]): string | undefined {
  return strings.reduce<string | undefined>((maxValue, thisValue) => {
    return maxValue === undefined || thisValue > maxValue ? thisValue : maxValue
  }, undefined)
}
