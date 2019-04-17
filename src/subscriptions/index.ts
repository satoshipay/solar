import { Asset, Server } from "stellar-sdk"
import { getHorizonURL } from "../lib/stellar"
import { SubscriptionTarget } from "../lib/subscription"
import { createAccountDataSubscription, ObservedAccountData } from "./account-data"
import { createAccountEffectsSubscription } from "./account-effects"
import { createAccountOffersSubscription, ObservedAccountOffers } from "./account-offers"
import { createOrderbookSubscription, ObservedTradingPair } from "./orderbook"
import { createRecentTxsSubscription, ObservedRecentTxs } from "./recent-txs"

export { ObservedAccountData, ObservedAccountOffers, ObservedRecentTxs, ObservedTradingPair }

const accountDataSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedAccountData>>()
const accountEffectsSubscriptionsCache = new Map<string, SubscriptionTarget<Server.EffectRecord | null>>()
const accountOffersSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedAccountOffers>>()
const orderbookSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedTradingPair>>()
const recentTxsSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedRecentTxs>>()

const allCaches = [
  accountDataSubscriptionsCache,
  accountEffectsSubscriptionsCache,
  accountOffersSubscriptionsCache,
  orderbookSubscriptionsCache,
  recentTxsSubscriptionsCache
]

export function getAssetCacheKey(asset: Asset) {
  return asset.isNative() ? "XLM" : asset.getIssuer() + asset.getCode()
}

export function resetAllSubscriptions() {
  // TODO: Does not cancel existing subscriptions as of right now!
  for (const cache of allCaches) {
    cache.clear()
  }
}

export function subscribeToAccount(horizon: Server, accountPubKey: string): SubscriptionTarget<ObservedAccountData> {
  const cacheKey = getHorizonURL(horizon) + accountPubKey
  const cached = accountDataSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const accountDataSubscription = createAccountDataSubscription(horizon, accountPubKey)
    accountDataSubscriptionsCache.set(cacheKey, accountDataSubscription)
    return accountDataSubscription
  }
}

export function subscribeToAccountEffects(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<Server.EffectRecord | null> {
  const cacheKey = getHorizonURL(horizon) + accountPubKey
  const cached = accountEffectsSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const accountEffectsSubscription = createAccountEffectsSubscription(horizon, accountPubKey)
    accountEffectsSubscriptionsCache.set(cacheKey, accountEffectsSubscription)
    return accountEffectsSubscription
  }
}

export function subscribeToAccountOffers(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedAccountOffers> {
  const cacheKey = getHorizonURL(horizon) + accountPubKey
  const cached = accountOffersSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const accountOffersSubscription = createAccountOffersSubscription(horizon, accountPubKey)
    accountOffersSubscriptionsCache.set(cacheKey, accountOffersSubscription)
    return accountOffersSubscription
  }
}

export function subscribeToOrders(
  horizon: Server,
  selling: Asset,
  buying: Asset
): SubscriptionTarget<ObservedTradingPair> {
  const cacheKey = getAssetCacheKey(selling) + getAssetCacheKey(buying)
  const cached = orderbookSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const ordersSubscription = createOrderbookSubscription(horizon, selling, buying)
    orderbookSubscriptionsCache.set(cacheKey, ordersSubscription)
    return ordersSubscription
  }
}

export function subscribeToRecentTxs(horizon: Server, accountPubKey: string): SubscriptionTarget<ObservedRecentTxs> {
  const cacheKey = getHorizonURL(horizon) + accountPubKey
  const cached = recentTxsSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const recentTxsSubscription = createRecentTxsSubscription(horizon, accountPubKey)
    recentTxsSubscriptionsCache.set(cacheKey, recentTxsSubscription)
    return recentTxsSubscription
  }
}
