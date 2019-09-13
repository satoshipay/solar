export interface AccountRecord {
  address: string
  paging_token: string
  name: string
  tags: string[]
  domain: string
  accepts: {
    memo: string
  }
}
