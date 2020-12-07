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

  Print: "Print",

  DeepLinkURL: "DeepLinkURL",

  CheckUpdateAvailability: "CheckUpdateAvailability",
  StartUpdate: "StartUpdate",

  ReadSettings: "ReadSettings",
  StoreSettings: "StoreSettings",
  ReadIgnoredSignatureRequestHashes: "ReadIgnoredSignatureRequestHashes",
  StoreIgnoredSignatureRequestHashes: "StoreIgnoredSignatureRequestHashes",

  GetKeyIDs: "GetKeyIDs",
  GetPublicKeyData: "GetPublicKeyData",
  GetPrivateKeyData: "GetPrivateKeyData",
  SaveKey: "SaveKey",
  SavePublicKeyData: "SavePublicKeyData",
  SignTransaction: "SignTransaction",
  RemoveKey: "RemoveKey"
} as const
