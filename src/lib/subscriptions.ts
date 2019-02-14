import {
  AccountRecord,
  Asset,
  OfferRecord,
  OperationRecord,
  Server,
  Transaction,
  TransactionRecord,
  EffectRecord
} from "stellar-sdk"
import { trackError } from "../context/notifications"
import { loadAccount, waitForAccountData } from "./account"
import { FixedOrderbookRecord } from "./orderbook"
import { getHorizonURL } from "./stellar"

type SubscriberFn<Thing> = (update: Thing) => void
type UnsubscribeFn = () => void

export interface SubscriptionTarget<Thing> {
  getLatest(): Thing
  subscribe(callback: SubscriberFn<Thing>): UnsubscribeFn
}

interface SubscriptionTargetInternals<Thing> {
  subscriptionTarget: SubscriptionTarget<Thing>
  propagateUpdate(update: Thing): void
}

export interface ObservedAccountData {
  activated: boolean
  balances: AccountRecord["balances"]
  id: string
  loading: boolean
  signers: AccountRecord["signers"]
  thresholds: AccountRecord["thresholds"]
}

export interface ObservedAccountOffers {
  loading: boolean
  offers: OfferRecord[]
}

export interface ObservedRecentTxs {
  activated: boolean
  loading: boolean
  transactions: Transaction[]
}

export interface ObservedTradingPair extends FixedOrderbookRecord {
  loading: boolean
}

type SerializedAsset =
  | {
      balance: string
      asset_type: "native"
    }
  | {
      balance: string
      limit: string
      asset_type: "credit_alphanum4" | "credit_alphanum12"
      asset_code: string
      asset_issuer: string
    }

const accountDataSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedAccountData>>()
const accountOffersSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedAccountOffers>>()
const orderSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedTradingPair>>()
const recentTxsSubscriptionsCache = new Map<string, SubscriptionTarget<ObservedRecentTxs>>()

export function getAssetCacheKey(asset: Asset) {
  return asset.isNative() ? "XLM" : asset.getIssuer() + asset.getCode()
}

function createSubscriptionTarget<Thing>(initialValue: Thing): SubscriptionTargetInternals<Thing> {
  let latestValue: Thing = initialValue
  let subscribers: Array<SubscriberFn<Thing>> = []

  const subscriptionTarget: SubscriptionTarget<Thing> = {
    getLatest() {
      return latestValue
    },
    subscribe(callback: SubscriberFn<Thing>) {
      subscribers.push(callback)
      const unsubscribe = () => {
        subscribers = subscribers.filter(someSubscriber => someSubscriber !== callback)
      }
      return unsubscribe
    }
  }
  const propagateUpdate = (update: Thing) => {
    latestValue = update
    for (const subscriber of subscribers) {
      subscriber(update)
    }
  }

  return {
    propagateUpdate,
    subscriptionTarget
  }
}

function createAccountDataSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedAccountData> {
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget<ObservedAccountData>({
    activated: false,
    balances: [],
    id: accountPubKey,
    loading: true,
    signers: [],
    thresholds: {
      low_threshold: 0,
      med_threshold: 0,
      high_threshold: 0
    }
  })

  const subscribeToAccountDataStream = (cursor: string = "now") => {
    let lastMessageJson = ""
    let lastMessageTime = 0

    horizon
      .accounts()
      .accountId(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage(accountData: AccountRecord) {
          const serialized = JSON.stringify(accountData)
          if (serialized !== lastMessageJson) {
            // Deduplicate messages. Every few seconds there is a new message with an unchanged value.
            lastMessageJson = serialized
            propagateUpdate({
              ...subscriptionTarget.getLatest(),
              ...(accountData as any)
            })
          }
          lastMessageTime = Date.now()
        },
        onerror(error: any) {
          setTimeout(() => {
            if (Date.now() - lastMessageTime > 3000) {
              // Every few seconds there is a new useless error with the same data as the previous.
              // So don't show them if there is a successful message afterwards (stream still seems to work)
              trackError(new Error("Account data update stream errored."))
            } else {
              // tslint:disable-next-line:no-console
              console.warn("Account data update stream had an error, but still seems to work fine:", error)
            }
          }, 2500)
        }
      } as any)
  }

  const fetchAccount = async () => {
    const initialAccountData = await loadAccount(horizon, accountPubKey)
    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      loading: false
    })

    const accountData = initialAccountData ? initialAccountData : await waitForAccountData(horizon, accountPubKey)

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      ...(accountData as any),
      activated: true
    })
    subscribeToAccountDataStream(initialAccountData ? "now" : "0")
  }

  fetchAccount().catch(trackError)

  return subscriptionTarget
}

function instantiateOffer(offer: OfferRecord) {
  // Fix offer to match the TypeScript types by instantiating the assets
  const buying: SerializedAsset = offer.buying as any
  const selling: SerializedAsset = offer.selling as any
  return {
    ...offer,
    buying: buying.asset_type === "native" ? Asset.native() : new Asset(buying.asset_code, buying.asset_issuer),
    selling: selling.asset_type === "native" ? Asset.native() : new Asset(selling.asset_code, selling.asset_issuer)
  }
}

function createAccountOffersSubscription(
  horizon: Server,
  accountPubKey: string
): SubscriptionTarget<ObservedAccountOffers> {
  const maxOffers = 100
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget<ObservedAccountOffers>({
    loading: true,
    offers: []
  })

  const subscribeToAccountOffersStream = () => {
    // horizon.offers("accounts", accountPubKey) does not seem to yield any updates, so falling back here...
    const pollingIntervalMs = 5000
    setInterval(() => {
      if (window.navigator.onLine !== false) {
        fetchAccountOffers().catch(trackError)
      }
    }, pollingIntervalMs)
  }

  const fetchAccountOffers = async () => {
    const accountOffers = await horizon
      .offers("accounts", accountPubKey)
      .limit(maxOffers)
      .call()

    const offers = accountOffers.records.map(instantiateOffer)

    if (JSON.stringify(offers) !== JSON.stringify(subscriptionTarget.getLatest().offers)) {
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        loading: false,
        offers
      })
    }
  }

  fetchAccountOffers().catch(trackError)
  subscribeToAccountOffersStream()

  return subscriptionTarget
}

function createOrderbookSubscription(
  horizon: Server,
  selling: Asset,
  buying: Asset
): SubscriptionTarget<ObservedTradingPair> {
  const { propagateUpdate, subscriptionTarget } = createSubscriptionTarget<ObservedTradingPair>({
    asks: [],
    base: selling,
    bids: [],
    counter: buying,
    loading: true
  })

  const maxOrderCount = 30
  const fetchOrders = async () => {
    const fetchResult = await horizon
      .orderbook(selling, buying)
      .limit(maxOrderCount)
      .call()

    // @types/stellar-sdk types seem wrong
    const orderbookRecord = (fetchResult as any) as FixedOrderbookRecord

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      ...orderbookRecord,
      loading: false
    })
  }
  const streamOrderUpdates = (cursor: string = "now") => {
    horizon
      .orderbook(selling, buying)
      .cursor(cursor)
      .stream({
        onmessage(record: FixedOrderbookRecord) {
          const previous = subscriptionTarget.getLatest()
          propagateUpdate({
            ...previous,
            ...record,
            asks: [...previous.asks, ...record.asks],
            bids: [...previous.bids, ...record.bids]
          })
        },
        onerror(error: any) {
          // FIXME: We don't want to see errors for every single stream,
          // unless it's really a stream-instance-specific error
          trackError(new Error("Orderbook update stream errored."))

          // tslint:disable-next-line:no-console
          console.error(error)
        }
      } as any)
  }

  fetchOrders().catch(trackError)
  streamOrderUpdates()

  return subscriptionTarget
}

async function createRecentTxsSubscription(
  { propagateUpdate, subscriptionTarget }: SubscriptionTargetInternals<ObservedRecentTxs>,
  horizon: Server,
  accountPubKey: string
): Promise<SubscriptionTarget<ObservedRecentTxs>> {
  const maxTxsToLoadCount = 15
  const deserializeTx = (txResponse: TransactionRecord) =>
    Object.assign(new Transaction(txResponse.envelope_xdr), {
      created_at: txResponse.created_at
    })

  const loadRecentTxs = async () => {
    const { records } = await horizon
      .transactions()
      .forAccount(accountPubKey)
      .limit(maxTxsToLoadCount)
      .order("desc")
      .call()

    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      transactions: [...subscriptionTarget.getLatest().transactions, ...records.map(deserializeTx)]
    })
  }
  const subscribeToTxs = (cursor: string = "now") => {
    horizon
      .transactions()
      .forAccount(accountPubKey)
      .cursor(cursor)
      .stream({
        onmessage(txResponse: TransactionRecord) {
          // Important: Insert new transactions in the front, since order is descending
          propagateUpdate({
            ...subscriptionTarget.getLatest(),
            transactions: [deserializeTx(txResponse), ...subscriptionTarget.getLatest().transactions]
          })
        },
        onerror(error: any) {
          trackError(new Error("Recent transactions update stream errored."))

          // tslint:disable-next-line:no-console
          console.error(error)
        }
      } as any)
  }

  try {
    await loadRecentTxs()
    propagateUpdate({
      ...subscriptionTarget.getLatest(),
      activated: true,
      loading: false
    })
    subscribeToTxs()
  } catch (error) {
    if (error.response && error.response.status === 404) {
      propagateUpdate({
        ...subscriptionTarget.getLatest(),
        activated: false,
        loading: false
      })
      waitForAccountData(horizon, accountPubKey)
        .then(({ initialFetchFailed }) => {
          propagateUpdate({
            ...subscriptionTarget.getLatest(),
            activated: true,
            loading: false
          })
          subscribeToTxs(initialFetchFailed ? "0" : "now")
        })
        .catch(trackError)
    } else {
      throw error
    }
  }

  return subscriptionTarget
}

export function createDeadSubscription<Value>(initialValue: Value): SubscriptionTarget<Value> {
  const { subscriptionTarget } = createSubscriptionTarget(initialValue)
  return subscriptionTarget
}

export function subscribeToAccount(horizon: Server, accountPubKey: string): SubscriptionTarget<ObservedAccountData> {
  const cacheKey = getHorizonURL(horizon) + accountPubKey
  const cached = accountDataSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const accountObservable = createAccountDataSubscription(horizon, accountPubKey)
    accountDataSubscriptionsCache.set(cacheKey, accountObservable)
    return accountObservable
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
    const accountOffers = createAccountOffersSubscription(horizon, accountPubKey)
    accountOffersSubscriptionsCache.set(cacheKey, accountOffers)
    return accountOffers
  }
}

export function subscribeToOrders(
  horizon: Server,
  selling: Asset,
  buying: Asset
): SubscriptionTarget<ObservedTradingPair> {
  const cacheKey = getAssetCacheKey(selling) + getAssetCacheKey(buying)
  const cached = orderSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const ordersObservable = createOrderbookSubscription(horizon, selling, buying)
    orderSubscriptionsCache.set(cacheKey, ordersObservable)
    return ordersObservable
  }
}

export function subscribeToRecentTxs(horizon: Server, accountPubKey: string): SubscriptionTarget<ObservedRecentTxs> {
  const cacheKey = getHorizonURL(horizon) + accountPubKey
  const cached = recentTxsSubscriptionsCache.get(cacheKey)

  if (cached) {
    return cached
  } else {
    const subscriptionInternals = createSubscriptionTarget<ObservedRecentTxs>({
      activated: false,
      loading: true,
      transactions: []
    })

    createRecentTxsSubscription(subscriptionInternals, horizon, accountPubKey).catch(trackError)
    recentTxsSubscriptionsCache.set(cacheKey, subscriptionInternals.subscriptionTarget)
    return subscriptionInternals.subscriptionTarget
  }
}
