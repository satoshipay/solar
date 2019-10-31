interface ElectronIPCCallMessage<Message extends IPC.Messages> {
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
  sendIPCMessage<Message extends IPC.Messages>(
    messageType: Message,
    message: ElectronIPCCallMessage<Message>
  ): Promise<any>
  subscribeToIPCMessages<Message extends IPC.Messages>(
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
