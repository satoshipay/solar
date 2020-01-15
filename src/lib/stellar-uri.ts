import { Transaction, Operation, Signer, Networks } from "stellar-sdk"
import { StellarUri, StellarUriType, TransactionStellarUri, parseStellarUri } from "@stellarguard/stellar-uri"

export enum PermittedNetworks {
  any,
  testnetOnly
}

export interface TrustedService {
  domain: string
  networks: PermittedNetworks
  signingKey: string
  validate(this: TrustedService, request: StellarUri, tx: Transaction): void
}

export interface VerificationOptions {
  allowUnsafeTestnetURIs?: boolean
}

export const trustedServices: TrustedService[] = [
  {
    domain: "test.stellarguard.me",
    networks: PermittedNetworks.testnetOnly,
    signingKey: "GDENOP42IGYUZH3B6BRDWWVTLG3AWKGACBF6CBAMJ5RWEMXLKI5IX2XM",
    validate(request, tx) {
      if (request.operation !== StellarUriType.Transaction) {
        throw Error("Expected a transaction request.")
      }
      if (tx.operations[0].type === "setOptions" && tx.operations[1].type === "setOptions") {
        const firstOperation = tx.operations[0] as Operation.SetOptions
        const secondOperation = tx.operations[1] as Operation.SetOptions
        if (
          !((secondOperation.signer as Signer.Ed25519PublicKey).ed25519PublicKey === this.signingKey) &&
          !((firstOperation.signer as Signer.Ed25519PublicKey).ed25519PublicKey === this.signingKey)
        ) {
          throw Error("Expected one of the signers to match the service's signing key.")
        }
      } else {
        throw Error("Transaction must only contain setOptions operations.")
      }
    }
  }
]

export async function verifyTransactionRequest(request: string, options: VerificationOptions = {}) {
  const parsedURI = parseStellarUri(request)
  const isSignatureValid = await parsedURI.verifySignature()

  if (!isSignatureValid) {
    if (parsedURI.isTestNetwork && options.allowUnsafeTestnetURIs) {
      // ignore
    } else {
      throw Error("Stellar URI's signature could not be verified.")
    }
  }

  const trustedService = trustedServices.find(service => parsedURI.originDomain === service.domain)

  if (!trustedService) {
    throw Error("Stellar URI does not originate from a trusted service.")
  }
  if (trustedService.networks !== PermittedNetworks.any && parsedURI.isPublicNetwork) {
    throw Error(
      `Conflict with ${trustedService.domain} policy: Service is not permitted to create public network transactions.`
    )
  }

  try {
    const networkPassphrase = parsedURI.isTestNetwork ? Networks.TESTNET : Networks.PUBLIC
    const transaction = new Transaction((parsedURI as TransactionStellarUri).xdr, networkPassphrase)
    trustedService.validate(parsedURI, transaction)
  } catch (error) {
    error.message = `Conflict with ${trustedService.domain} policy: ${error.message}`
    throw error
  }

  return parsedURI
}
