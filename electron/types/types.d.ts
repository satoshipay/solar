declare module "electron-reload" {
  export default function autoReload(
    paths: string,
    options?: { electron?: string; argv?: string[]; hardResetMethod?: "exit"; forceHardReset?: boolean }
  ): void
}
