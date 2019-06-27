import React from "react"
import { StellarUri, StellarUriType, TransactionStellarUri, parseStellarUri } from "@stellarguard/stellar-uri"
import { trackError } from "./notifications"
import { subscribeToDeepLinkURLs } from "../platform/protocol-handler"
import { Transaction, Operation, Signer, OperationType } from "stellar-sdk"

interface TrustedService {
  domain: string
  publicKey: string
  validateTransaction(tx: Transaction): void
}

const trustedServices: TrustedService[] = [
  {
    domain: "test.stellarguard.me",
    publicKey: "GDENOP42IGYUZH3B6BRDWWVTLG3AWKGACBF6CBAMJ5RWEMXLKI5IX2XM",
    validateTransaction(tx) {
      if (tx.operations[0].type === "setOptions" && tx.operations[1].type === "setOptions") {
        const firstOperation = tx.operations[0] as Operation.SetOptions
        const secondOperation = tx.operations[1] as Operation.SetOptions
        if (
          !((secondOperation.signer as Signer.Ed25519PublicKey).ed25519PublicKey === this.publicKey) &&
          !((firstOperation.signer as Signer.Ed25519PublicKey).ed25519PublicKey === this.publicKey)
        ) {
          throw new Error("Public key of transaction does not match StellarGuard public key")
        }
      } else {
        throw new Error("Transaction must only contain setOptions operations.")
      }
    }
  }
]

interface Props {
  children: React.ReactNode
}

interface ContextType {
  uri: StellarUri | null
  clearURI: () => void
}

const initialValues: ContextType = {
  uri: null,
  clearURI: () => undefined
}

const TransactionRequestContext = React.createContext<ContextType>(initialValues)

export function TransactionRequestProvider(props: Props) {
  const [uri, setURI] = React.useState<StellarUri | null>(null)

  const clearURI = () => {
    setURI(null)
  }

  const verify = async (request: string) => {
    try {
      const parsedURI = parseStellarUri(request)

      const isVerified = await parsedURI.verifySignature()
      if (isVerified) {
        setURI(parsedURI)
      } else {
        if (parsedURI.isTestNetwork) {
          // try fallback on testnet
          verifyWithTrustedService(parsedURI)
        } else {
          trackError(new Error(`Verification of uri '${parsedURI}' failed`))
        }
      }
    } catch (error) {
      trackError(error)
    }
  }
  const verifyWithTrustedService = (uriToVerify: StellarUri) => {
    const trustedService = trustedServices.find(ts => ts.domain === uriToVerify.originDomain)
    if (trustedService) {
      try {
        if (uriToVerify.operation === StellarUriType.Transaction) {
          const transaction = new Transaction((uriToVerify as TransactionStellarUri).xdr)
          trustedService.validateTransaction(transaction)
          setURI(uriToVerify)
        }
      } catch (error) {
        trackError(error)
      }
    }
  }

  React.useEffect(() => {
    const unsubscribe = subscribeToDeepLinkURLs(url => {
      verify(url)
    })

    return unsubscribe
  }, [])

  return (
    <TransactionRequestContext.Provider value={{ uri, clearURI }}>{props.children}</TransactionRequestContext.Provider>
  )
}

export { ContextType as TransactionRequestContextType, TransactionRequestContext }
