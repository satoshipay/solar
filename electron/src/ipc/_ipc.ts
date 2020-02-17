import { ipcMain } from "electron"
import pick from "lodash.pick"

export function expose<Message extends keyof IPC.MessageType>(
  messageType: Message,
  handler: (
    ...args: IPC.MessageArgs<Message>
  ) => IPC.MessageReturnType<Message> | Promise<IPC.MessageReturnType<Message>>
) {
  ipcMain.on(messageType, async (event: Electron.IpcMainEvent, payload: ElectronIPCCallMessage<Message>) => {
    const { args, callID } = payload
    try {
      const result = await handler(...args)
      event.sender.send(messageType, { callID, result })
    } catch (error) {
      const extras = pick(error, error.__extraProps || [])
      event.sender.send(messageType, {
        callID,
        error: {
          ...extras,
          __extraProps: error.__extraProps,
          message: error.message,
          name: error.name || "Error",
          stack: error.stack
        }
      })
    }
  })
}
