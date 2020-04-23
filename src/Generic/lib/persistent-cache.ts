export interface PersistentCache<Value> {
  delete(key: string): void
  keys(): string[]
  read(key: string): Value | null
  save(key: string, value: Value, expiresInMs?: number): void
}

interface CacheIndexItem {
  expiresAt: number
  key: string
}

function sweepStaleIndexItems(sortedIndex: CacheIndexItem[]) {
  for (let i = 0; i < sortedIndex.length; i++) {
    if (sortedIndex[i].expiresAt > Date.now()) {
      return sortedIndex.slice(i)
    }
  }

  return []
}

export interface PersistentCacheOptions {
  /** Item default expiry in `ms from now` */
  expiresIn?: number
  maxItems?: number
}

export function createPersistentCache<Value>(
  namespace: string,
  options: PersistentCacheOptions = {}
): PersistentCache<Value> {
  const LocalStorageIndexKey = () => `caches.index:${namespace}`
  const LocalStorageItemKey = (key: string) => `caches.values:${namespace}.${key}`

  let index: CacheIndexItem[] = JSON.parse(localStorage.getItem(LocalStorageIndexKey()) || "[]")
  index.sort((a, b) => (a.expiresAt || Number.POSITIVE_INFINITY) - (b.expiresAt || Number.POSITIVE_INFINITY))

  index = sweepStaleIndexItems(index)

  return {
    delete(key) {
      index = index.filter(item => item.key !== key)
      localStorage.removeItem(LocalStorageItemKey(key))
      localStorage.setItem(LocalStorageIndexKey(), JSON.stringify(index))
    },
    keys() {
      return index.map(item => item.key)
    },
    read(key) {
      const item = index.find(someItem => someItem.key === key)

      if (!item || item.expiresAt <= Date.now()) {
        // Make sure we don't return expired data
        return null
      }
      const value = localStorage.getItem(LocalStorageItemKey(key))
      return value ? JSON.parse(value) : null
    },
    save(key, value, expiresInMs?) {
      index = sweepStaleIndexItems(index)

      if (value === undefined) {
        // Trying to JSON.serialize(undefined) will lead to dark places…
        throw Error("Cannot cache an undefined value")
      }

      const expiresIn = expiresInMs || options.expiresIn || 0
      const expiresAt = expiresIn ? Date.now() + expiresIn : 0

      const newIndexItem: CacheIndexItem = {
        expiresAt,
        key
      }

      index = index.filter(item => item.key !== key)

      if (expiresAt === 0) {
        index.push(newIndexItem)
      } else {
        const firstIndexExpiringLater = index.findIndex(item => item.expiresAt > expiresAt || item.expiresAt === 0)
        index =
          firstIndexExpiringLater === -1
            ? [...index, newIndexItem]
            : [...index.slice(0, firstIndexExpiringLater), newIndexItem, ...index.slice(firstIndexExpiringLater)]
      }

      if (options.maxItems && index.length >= options.maxItems) {
        index = index.slice(-options.maxItems)
      }

      localStorage.setItem(LocalStorageItemKey(key), JSON.stringify(value))
      localStorage.setItem(LocalStorageIndexKey(), JSON.stringify(index))
    }
  }
}
