import qs from "qs"
import { Transaction } from "stellar-sdk"
import { signatureMatchesPublicKey } from "./stellar"

export interface MultisigServerInfo {
  capabilities: string[]
}

export enum MultisigTransactionStatus {
  failed = "failed",
  pending = "pending",
  ready = "ready",
  submitted = "submitted"
}

export interface MultisigTransactionResponse {
  created_at: string
  cursor: string
  error?: {
    message: string
    details: any
  }
  hash: string
  req: string
  status: MultisigTransactionStatus
  signed_by: string[]
  signers: string[]
  updated_at: string
}

export interface SignatureRequestSigner {
  account_id: string
  has_signed: boolean
}

export interface TxParameters {
  callback?: string
  pubkey?: string
  msg?: string
  network_passphrase?: string
  origin_domain?: string
  signature?: string
}

export function createSignatureRequestURI(transaction: Transaction, options: TxParameters) {
  const xdr = transaction
    .toEnvelope()
    .toXDR()
    .toString("base64")

  const query: { [paramName: string]: string | undefined } = {
    ...options,
    xdr
  }
  return "web+stellar:tx?" + qs.stringify(query)
}

export function isSignedByOneOf(transaction: Transaction, localPublicKeys: string[]) {
  return localPublicKeys.some(publicKey =>
    transaction.signatures.some(signature => signatureMatchesPublicKey(signature, publicKey))
  )
}
