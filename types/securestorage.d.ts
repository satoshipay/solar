interface CordovaSecureStorage {
  new (success: () => void, error: (error: any) => void, storage_name: string): CordovaSecureStorage

  get(success: (value: any) => void, error: (error: any) => void, key: string): any
  set(success: (key: any) => void, error: (error: any) => void, key: string, value: string): void
  remove(success: (key: any) => void, error: (error: any) => void, key: string): void
  keys(success: (keys: any) => void, error: (error: any) => void): Array<any>
  clear(success: () => void, error: (error: any) => void): void
}

interface CordovaPlugins {
  SecureStorage: CordovaSecureStorage
}
