import { Transaction, Horizon, Networks } from "stellar-sdk"
import { CustomError } from "./errors"
import StellarGuardIcon from "~Icons/components/StellarGuard"
import LobstrVaultIcon from "~Icons/components/LobstrVault"
import { workers } from "~Workers/worker-controller"

export interface ThirdPartySecurityService {
  endpoints: {
    testnet?: string
    mainnet: string
  }
  icon: (props: { style: React.CSSProperties }) => JSX.Element
  name: string
  publicKey: string
}

const services: ThirdPartySecurityService[] = [
  {
    endpoints: {
      mainnet: "https://stellarguard.me/api/transactions",
      testnet: "https://test.stellarguard.me/api/transactions"
    },
    icon: StellarGuardIcon,
    name: "StellarGuard",
    publicKey: "GCVHEKSRASJBD6O2Z532LWH4N2ZLCBVDLLTLKSYCSMBLOYTNMEEGUARD"
  },
  {
    endpoints: {
      mainnet: "https://vault.lobstr.co/api/transactions/"
    },
    icon: LobstrVaultIcon,
    name: "LOBSTR Vault",
    publicKey: "GA2T6GR7VXXXBETTERSAFETHANSORRYXXXPROTECTEDBYLOBSTRVAULT"
  }
]

export async function isThirdPartyProtected(accountPubKey: string, network: Networks) {
  const { netWorker } = await workers

  const account = await netWorker.fetchAccountData(accountPubKey, network)
  const signerKeys = (account?.signers || []).map(signer => signer.key)

  const enabledService = services.find(service => signerKeys.includes(service.publicKey))
  return enabledService
}

export function containsThirdPartySigner(signers: Horizon.AccountSigner[]) {
  const signerKeys = signers.map(signer => signer.key)

  const enabledService = services.find(service => signerKeys.includes(service.publicKey))
  return enabledService
}

export async function submitTransactionToThirdPartyService(
  signedTransaction: Transaction,
  service: ThirdPartySecurityService,
  testnet: boolean
) {
  const signedTransactionXDR = signedTransaction
    .toEnvelope()
    .toXDR()
    .toString("base64")

  const body = { xdr: signedTransactionXDR }

  if (testnet && !service.endpoints.testnet) {
    throw CustomError("TestnetEndpointNotAvailableError", `${service.name} does not provide a testnet endpoint.`, {
      service: service.name
    })
  }

  const endpoint = testnet ? service.endpoints.testnet! : service.endpoints.mainnet

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type")
    const responseBodyObject = contentType?.startsWith("application/json")
      ? await response.json()
      : await response.text()

    const message =
      typeof responseBodyObject === "string"
        ? responseBodyObject
        : responseBodyObject.detail || responseBodyObject.message || responseBodyObject.error

    throw CustomError(
      "SubmissionFailedError",
      `Submitting transaction to ${service.name} failed with status ${response.status}: ${message}`,
      {
        endpoint: service.name,
        message,
        status: String(response.status)
      }
    )
  }

  return response
}
