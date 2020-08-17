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

  GetKeyIDs: "GetKeyIDs",
  GetPublicKeyData: "GetPublicKeyData",
  GetPrivateKeyData: "GetPrivateKeyData",
  SaveKey: "SaveKey",
  SavePublicKeyData: "SavePublicKeyData",
  SignTransaction: "SignTransaction",
  RemoveKey: "RemoveKey",

  GetHardwareWallets: "GetHardwareWallets",
  GetHardwareWalletAccounts: "GetHardwareWalletAccounts",
  HardwareWalletAdded: "HardwareWalletAdded",
  HardwareWalletRemoved: "HardwareWalletRemoved",
  SignTransactionWithHardwareWallet: "SignTransactionWithHardwareWallet",

  IsBluetoothAvailable: "IsBluetoothAvailable",
  StartBluetoothDiscovery: "StartBluetoothDiscovery",
  StopBluetoothDiscovery: "StopBluetoothDiscovery"
} as const
