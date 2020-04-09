interface ElectronIPCCallMessage<Message extends keyof IPC.MessageType> {
  args: IPC.MessageArgs<Message>
  callID: number
}

interface ElectronIPCCallErrorMessage {
  callID: number
  error: Error
}

interface ElectronIPCCallResultMessage {
  callID: number
  result: any
}

type ElectronIPCCallResponseMessage = ElectronIPCCallErrorMessage | ElectronIPCCallResultMessage

interface ElectronContext {
  sendIPCMessage<Message extends keyof IPC.MessageType>(
    messageType: Message,
    message: ElectronIPCCallMessage<Message>
  ): Promise<any>
  subscribeToIPCMessages<Message extends keyof IPC.MessageType>(
    messageType: Message,
    subscribeCallback: (event: Event, result: IPC.MessageReturnType<Message>) => void
  ): () => void
}

interface Window {
  // Will only be defined when in an electron build
  electron?: ElectronContext
}

declare module NodeJS {
  interface Global {
    // Will only be defined when in an electron build
    electron?: ElectronContext
    process: NodeJS.Process
  }
}

declare module "electron-reload" {
  export default function autoReload(
    paths: string,
    options?: { electron?: string; argv?: string[]; hardResetMethod?: "exit"; forceHardReset?: boolean }
  ): void
}

declare module "@ledgerhq/hw-app-str" {
  export default class Str {
    constructor(transport: Transport<*>, scrambleKey: string = "l0v")
    getAppConfiguration: () => Promise<{ version: string }>
    getPublicKey: (
      path: string,
      boolValidate?: boolean,
      boolDisplay?: boolean
    ) => Promise<{ publicKey: string; raw: Buffer }>
    signTransaction: (path: string, transaction: Buffer) => Promise<{ signature: Buffer }>
    signHash: (path: string, hash: Buffer) => Promise<{ signature: Buffer }>
  }
}
