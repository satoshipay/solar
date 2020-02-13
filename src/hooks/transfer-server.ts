import {
  fetchTransferInfos,
  openTransferServer,
  TransferServer,
  TransferServerInfo
} from "@satoshipay/stellar-transfer"
import { Asset, Networks } from "stellar-sdk"
import { mapSuspendables } from "../lib/suspense"
import { transferInfosCache } from "./_caches"
import { useAccountHomeDomains } from "./stellar"

const dedupe = <T>(input: T[]): T[] => Array.from(new Set(input))

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((resolve, reject) => {
      setTimeout(() => reject(Error(message)), ms)
    })
  ])
}

async function initTransferServer(domain: string, testnet: boolean): Promise<TransferServer | undefined> {
  const network = testnet ? Networks.TESTNET : Networks.PUBLIC

  try {
    const transferServer = await withTimeout(
      openTransferServer(domain, network, {
        walletName: "Solar",
        walletURL: "https://solarwallet.io"
      }),
      8000,
      `Transfer server discovery at ${domain} timed out.`
    )
    return transferServer
  } catch (error) {
    // tslint:disable-next-line no-console
    console.error(`Treating ${domain} as no transfer server available:`, error)
    return undefined
  }
}

export function useTransferInfos(assets: Asset[], testnet: boolean): Array<TransferServerInfo | undefined> {
  const accountIDs = assets.map(asset => asset.issuer).filter(issuer => Boolean(issuer))
  const homeDomains = useAccountHomeDomains(accountIDs, testnet)
  const domains = dedupe(homeDomains).filter((domain): domain is string => Boolean(domain))

  return mapSuspendables(
    domains,
    domain => {
      return (transferInfosCache.get(domain) ||
        transferInfosCache.suspend(domain, async () => {
          const transferServer = await initTransferServer(domain, testnet)
          if (!transferServer) return []

          const transferInfo = await fetchTransferInfos(transferServer)
          return (transferInfo ? [transferInfo] : []) as [TransferServerInfo] | []
        }))[0]
    },
    { ignoreSingleErrors: true }
  )
}
