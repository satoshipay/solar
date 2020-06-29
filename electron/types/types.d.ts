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
  declare class Str {
    constructor(transport: any, scrambleKey: string = "l0v")
    getAppConfiguration: () => Promise<{ version: string }>
    getPublicKey: (
      path: string,
      boolValidate?: boolean,
      boolDisplay?: boolean
    ) => Promise<{ publicKey: string; raw: Buffer }>
    signTransaction: (path: string, transaction: Buffer) => Promise<{ signature: Buffer }>
    signHash: (path: string, hash: Buffer) => Promise<{ signature: Buffer }>
  }

  export default Str
}

declare module "@ledgerhq/hw-transport-node-ble" {
  import Observable from "zen-observable"

  declare class TransportNodeBLE {
    constructor(device: any, ledgerTransport?: boolean, timeout?: number)
    static availability: Observable<boolean>
    static open(path: string): Promise<TransportNodeBLE>
    setScrambleKey(): void
    static listen(observer: Observer<DescriptorEvent<Descriptor>>): Subscription

    device: HID.HID
    id: string
    ledgerTransport: boolean
    timeout: number
    exchangeStack: any[]
  }

  type Device = any
  type Descriptor = string
  interface DescriptorEvent<Descriptor> {
    type: "add" | "remove"
    descriptor: Descriptor
    device?: Device
  }
  interface Observer<Ev> {
    readonly next: (event: Ev) => any
    readonly error: (e: any) => any
    readonly complete: () => any
  }
  interface Subscription {
    readonly unsubscribe: () => void
  }

  export default TransportNodeBLE
}
