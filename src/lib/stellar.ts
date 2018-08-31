const MAX_INT64 = "9223372036854775807"

export function trustlineLimitEqualsUnlimited(limit: string | number) {
  return String(limit).replace(".", "") == MAX_INT64
}
