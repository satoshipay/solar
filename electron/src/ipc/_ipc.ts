import { ipcMain } from "electron"

export function expose<Message extends IPC.Messages>(
  messageType: Message,
  handler: (
    ...args: IPC.MessageArgs<Message>
  ) => IPC.MessageReturnType<Message> | Promise<IPC.MessageReturnType<Message>>
) {
  ipcMain.on(messageType, async (event: Electron.Event, payload: ElectronIPCCallMessage<Message>) => {
    const { args, callID } = payload
    try {
      const result = await handler(...args)
      event.sender.send(messageType, { callID, result })
    } catch (error) {
      event.sender.send(messageType, {
        error: { name: error.name || "Error", message: error.message, stack: error.stack },
        callID
      })
    }
  })
}
