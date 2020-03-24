export const Messages: IPC.MessageType = {
  CopyToClipboard: "CopyToClipboard",

  ScanQRCode: "ScanQRCode",

  ShowSplashScreen: "ShowSplashScreen",
  HideSplashScreen: "HideSplashScreen",

  BioAuthAvailable: "BioAuthAvailable",
  TestBioAuth: "TestBioAuth",

  NotificationPermission: "NotificationPermission",
  RequestNotificationPermission: "RequestNotificationPermission",
  ShowNotification: "ShowNotification",

  OpenLink: "OpenLink",

  DeepLinkURL: "DeepLinkURL",

  CheckUpdateAvailability: "CheckUpdateAvailability",
  StartUpdate: "StartUpdate",

  ReadSettings: "ReadSettings",
  StoreSettings: "StoreSettings",
  ReadIgnoredSignatureRequestHashes: "ReadIgnoredSignatureRequestHashes",
  StoreIgnoredSignatureRequestHashes: "StoreIgnoredSignatureRequestHashes",

  CreateKey: "CreateKey",
  GetAppKeyMetadata: "GetAppKeyMetadata",
  GetKeyIDs: "GetKeyIDs",
  GetPublicKeyData: "GetPublicKeyData",
  GetPrivateKey: "GetPrivateKey",
  HasSetAppPassword: "HasSetAppPassword",
  RemoveKey: "RemoveKey",
  RenameKey: "RenameKey",
  UpdateAppPassword: "UpdateAppPassword",
  UpdateKeyTxAuth: "UpdateKeyTxAuth",
  SetUpAppPassword: "SetUpAppPassword",
  SignTransaction: "SignTransaction"
} as const
