import { expose } from "threads"
import { fetchAllAssets, fetchStellarToml, fetchWellknownAccounts } from "./stellar-ecosystem"

const netWorker = {
  fetchAllAssets,
  fetchStellarToml,
  fetchWellknownAccounts
}

export type NetWorker = typeof netWorker

expose(netWorker)
