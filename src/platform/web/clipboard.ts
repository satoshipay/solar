export function copyToClipboard(text: string): Promise<any> {
  return (navigator as any).clipboard.writeText(text)
}
