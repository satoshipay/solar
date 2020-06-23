export type StellarTomlIssuer = Partial<{
  ORG_NAME: string
  ORG_DBA: string
  ORG_URL: string
  ORG_LOGO: string
  ORG_DESCRIPTION: string
  ORG_PHYSICAL_ADDRESS: string
  ORG_PHYSICAL_ADDRESS_ATTESTATION: string
  ORG_PHONE_NUMBER: string
  ORG_PHONE_NUMBER_ATTESTATION: string
  ORG_KEYBASE: string
  ORG_TWITTER: string
  ORG_GITHUB: string
  ORG_OFFICIAL_EMAIL: string
  ORG_LICENSING_AUTHORITY: string
  ORG_LICENSE_TYPE: string
  ORG_LICENSE_NUMBER: string
}>

export type StellarTomlPrincipal = Partial<{
  name: string
  email: string
  keybase: string
  telegram: string
  twitter: string
  github: string
  id_photo_hash: string
  verification_photo_hash: string
}>

export type StellarTomlCurrency = Partial<{
  code: string
  code_template: string
  issuer: string
  status: "live" | "dead" | "test" | "private"
  display_decimals: number
  name: string
  desc: string
  conditions: string
  image: string
  fixed_number: number
  max_number: number
  is_unlimited: boolean
  is_asset_anchored: boolean
  anchor_asset_type: "fiat" | "crypto" | "stock" | "bond" | "commodity" | "realestate" | "other"
  anchor_asset: string
  redemption_instructions: string
  regulated: boolean
  approval_server: string
  approval_criteria: string
}>

export type StellarToml = Partial<{
  CURRENCIES: StellarTomlCurrency[]
  DOCUMENTATION: StellarTomlIssuer
  MULTISIG_ENDPOINT: string
  PRINCIPALS: StellarTomlPrincipal[]
  SIGNING_KEY?: string
  TRANSFER_SERVER?: string
  TRANSFER_SERVER_SEP0024?: string
  URI_REQUEST_SIGNING_KEY?: string
}>
