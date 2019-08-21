export enum SolarUriType {
  Import = "solar+import"
}

export class SolarUri {
  protected uri: URL

  constructor(uri: URL | string) {
    this.uri = typeof uri === "string" ? new URL(uri) : new URL(uri.toString())
  }

  get operation(): SolarUriType {
    return this.uri.pathname as SolarUriType
  }

  get isTestNetwork() {
    return this.getParam("testnet") !== undefined && this.getParam("testnet") === "true"
  }

  toString() {
    return this.uri.toString()
  }

  getParam(key: string): string | undefined {
    return this.uri.searchParams.get(key) || undefined
  }

  setParam(key: string, value?: string) {
    if (value === undefined) {
      this.uri.searchParams.delete(key)
    } else {
      this.uri.searchParams.set(key, value)
    }
  }
}
