import { TFunction } from "i18next"
import { Server, Transaction, Horizon } from "stellar-sdk"

const STELLARGUARD_TRANSACTION_ENDPOINT_MAINNET = "https://stellarguard.me/api/transactions"
const STELLARGUARD_TRANSACTION_ENDPOINT_TESTNET = "https://test.stellarguard.me/api/transactions"
const STELLARGUARD_PUBLIC_KEY = "GCVHEKSRASJBD6O2Z532LWH4N2ZLCBVDLLTLKSYCSMBLOYTNMEEGUARD"

export async function isStellarGuardProtected(horizon: Server, accountPubKey: string) {
  const account = await horizon.loadAccount(accountPubKey)
  return account.signers.some(signer => signer.key === STELLARGUARD_PUBLIC_KEY)
}

export function containsStellarGuardAsSigner(signers: Horizon.AccountSigner[]) {
  return signers.some(signer => signer.key === STELLARGUARD_PUBLIC_KEY)
}

export async function submitTransactionToStellarGuard(signedTransaction: Transaction, testnet: boolean, t: TFunction) {
  const signedTransactionXDR = signedTransaction
    .toEnvelope()
    .toXDR()
    .toString("base64")

  const body = { xdr: signedTransactionXDR }

  const endpoint = testnet ? STELLARGUARD_TRANSACTION_ENDPOINT_TESTNET : STELLARGUARD_TRANSACTION_ENDPOINT_MAINNET

  const response = await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  })

  if (!response.ok) {
    const contentType = response.headers.get("Content-Type")
    const responseBodyObject = contentType && contentType.startsWith("application/json") ? await response.json() : null

    throw new Error(
      t("error.stellar-guard.submission-failed", {
        status: response.status,
        message: responseBodyObject && responseBodyObject.message ? responseBodyObject.message : await response.text()
      })
    )
  }

  return response
}
