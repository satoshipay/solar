import { parseStellarUri } from "@stellarguard/stellar-uri"
import { CustomError } from "~Generic/lib/errors"

export interface VerificationOptions {
  allowUnsafeTestnetURIs?: boolean
}

export async function verifyTransactionRequest(request: string, options: VerificationOptions = {}) {
  const parsedURI = parseStellarUri(request)
  const isSignatureValid = await parsedURI.verifySignature()

  if (!isSignatureValid) {
    if (parsedURI.isTestNetwork && options.allowUnsafeTestnetURIs) {
      // ignore
    } else {
      throw CustomError("StellarUriVerificationError", "Stellar URI's signature could not be verified.")
    }
  }

  return parsedURI
}
