const commands = {
  getKeyIDsCommand: "keystore:getKeyIDs",
  getPublicKeyDataCommand: "keystore:getPublicKeyData",
  getPrivateKeyDataCommand: "keystore:getPrivateKeyData",
  saveKeyCommand: "keystore:saveKey",
  savePublicKeyDataCommand: "keystore:savePublicKeyData",
  signTransactionCommand: "keystore:signTransaction",
  removeKeyCommand: "keystore:removeKey",

  readSettingsCommand: "storage:settings:read",
  storeSettingsCommand: "storage:settings:store",
  readIgnoredSignatureRequestsCommand: "storage:ignoredSignatureRequests:read",
  storeIgnoredSignatureRequestsCommand: "storage:ignoredSignatureRequests:store"
}

const events = {
  getKeyIDsEvent: "keystore:keyIDs",
  getPublicKeyDataEvent: "keystore:publicKeyData",
  getPrivateKeyDataEvent: "keystore:privateKeyData",
  saveKeyEvent: "keystore:savedKey",
  savePublicKeyDataEvent: "keystore:savedPublicKeyData",
  signTransactionEvent: "keystore:signedTransaction",
  removeKeyEvent: "keystore:removedKey"
}

function expose(ipc, commandType, eventType, handler) {
  ipc.on(commandType, async (event, payload) => {
    const { args, messageID } = payload
    try {
      const result = await handler(...args)
      event.sender.send(eventType, { messageID, result })
    } catch (error) {
      event.sender.send(eventType, {
        error: { name: error.name || "Error", message: error.message, stack: error.stack },
        messageID
      })
    }
  })
}

module.exports = {
  commands,
  events,
  expose
}
