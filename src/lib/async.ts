export type FetchState<T> = { state: "pending" } | { state: "resolved"; data: T } | { state: "rejected"; error: Error }

export const FetchState = {
  pending() {
    return { state: "pending" } as const
  },
  resolved<T>(data: T) {
    return { state: "resolved", data } as const
  },
  rejected(error: Error) {
    return { state: "rejected", error } as const
  }
}
