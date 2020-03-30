declare namespace IPC {
  /**
   * Those are the messages (commands) that you can send either from React app
   * to platform code or vice versa. Many messages provoke a callback
   * message – we don't need to define message types for them as they
   * reference the call itself (each call is assigned a numeric call ID).
   */

  const Messages: {
    CopyToClipboard: "CopyToClipboard"

    ScanQRCode: "ScanQRCode"

    ShowSplashScreen: "ShowSplashScreen"
    HideSplashScreen: "HideSplashScreen"

    BioAuthAvailable: "BioAuthAvailable"
    TestBioAuth: "TestBioAuth"

    NotificationPermission: "NotificationPermission"
    RequestNotificationPermission: "RequestNotificationPermission"
    ShowNotification: "ShowNotification"

    OpenLink: "OpenLink"

    DeepLinkURL: "DeepLinkURL"

    CheckUpdateAvailability: "CheckUpdateAvailability"
    StartUpdate: "StartUpdate"

    ReadSettings: "ReadSettings"
    StoreSettings: "StoreSettings"
    ReadIgnoredSignatureRequestHashes: "ReadIgnoredSignatureRequestHashes"
    StoreIgnoredSignatureRequestHashes: "StoreIgnoredSignatureRequestHashes"

    CreateKey: "CreateKey"
    GetAppKeyMetadata: "GetAppKeyMetadata"
    GetKeyIDs: "GetKeyIDs"
    GetPublicKeyData: "GetPublicKeyData"
    GetPrivateKey: "GetPrivateKey"
    HasSetAppPassword: "HasSetAppPassword"
    RemoveKey: "RemoveKey"
    RenameKey: "RenameKey"
    SetUpAppPassword: "SetUpAppPassword"
    SignTransaction: "SignTransaction"
    UpdateAppPassword: "UpdateAppPassword"
    UpdateKeyPassword: "UpdateKeyPassword"
    UpdateKeyTxAuth: "UpdateKeyTxAuth"
  }

  export type MessageType = typeof Messages

  export interface MessageSignatures {
    [Messages.CopyToClipboard]: (text: string) => void

    [Messages.ScanQRCode]: () => string

    [Messages.ShowSplashScreen]: () => void
    [Messages.HideSplashScreen]: () => void

    [Messages.BioAuthAvailable]: () => BiometricAvailability
    [Messages.TestBioAuth]: () => string | undefined

    [Messages.NotificationPermission]: () => NotificationPermission
    [Messages.RequestNotificationPermission]: () => boolean
    [Messages.ShowNotification]: (notification: LocalNotification) => void

    [Messages.OpenLink]: (href: string) => void

    [Messages.DeepLinkURL]: () => string

    [Messages.CheckUpdateAvailability]: () => boolean
    [Messages.StartUpdate]: () => void

    [Messages.ReadSettings]: () => Partial<Platform.SettingsData>
    [Messages.StoreSettings]: (updatedSettings: Partial<Platform.SettingsData>) => boolean
    [Messages.ReadIgnoredSignatureRequestHashes]: () => string[]
    [Messages.StoreIgnoredSignatureRequestHashes]: (updatedHashes: string[]) => boolean

    [Messages.CreateKey]: (
      keyID: string,
      password: string,
      privateKey: string,
      options: Pick<KeyStoreAccountV1.PublicKeyData, "name" | "publicKey" | "testnet" | "txAuth">
    ) => void
    [Messages.GetAppKeyMetadata]: () => KeyStoreAppKey.AppKeyData | null
    [Messages.GetKeyIDs]: () => string[]
    [Messages.GetPublicKeyData]: (keyID: string) => KeyStoreAccount.PublicKeyData
    [Messages.GetPrivateKey]: (keyID: string, password: string) => string
    [Messages.HasSetAppPassword]: () => boolean
    [Messages.RemoveKey]: (keyID: string) => void
    [Messages.RenameKey]: (keyID: string, newName: string) => void
    [Messages.SetUpAppPassword]: (
      password: string,
      privateKey: string,
      authPolicy: KeyStoreAppKey.AppAuthPolicy
    ) => void
    [Messages.SignTransaction]: (internalAccountID: string, transactionXDR: string, password: string) => string
    [Messages.UpdateAppPassword]: (
      newPassword: string,
      prevPassword: string,
      policy: KeyStoreAppKey.AppAuthPolicy
    ) => void
    /** @deprecated */
    [Messages.UpdateKeyPassword]: (keyID: string, newPassword: string, prevPassword: string) => void
    [Messages.UpdateKeyTxAuth]: (keyID: string, policy: KeyStoreAccount.TxAuthPolicy, password: string | null) => void
  }

  export type MessageArgs<Message extends keyof MessageType> = MessageSignatures[Message] extends () => any
    ? []
    : MessageSignatures[Message] extends (arg0: infer Arg0) => any
    ? [Arg0]
    : MessageSignatures[Message] extends (arg0: infer Arg0, arg1: infer Arg1) => any
    ? [Arg0, Arg1]
    : MessageSignatures[Message] extends (arg0: infer Arg0, arg1: infer Arg1, arg2: infer Arg2) => any
    ? [Arg0, Arg1, Arg2]
    : MessageSignatures[Message] extends (arg0: infer Arg0, arg1: infer Arg1, arg2: infer Arg2, arg3: infer Arg3) => any
    ? [Arg0, Arg1, Arg2, Arg3]
    : never

  export type MessageReturnType<Message extends keyof MessageType> = ReturnType<MessageSignatures[Message]>
}
