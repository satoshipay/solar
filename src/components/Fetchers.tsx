import React from "react"
import { useWellKnownAccounts } from "../hooks/stellar-ecosystem"
import { Address } from "./PublicKey"

interface AccountNameProps {
  publicKey: string
  testnet: boolean
}

export const AccountName = React.memo(function AccountName(props: AccountNameProps) {
  const wellknownAccounts = useWellKnownAccounts(props.testnet)
  const record = wellknownAccounts.lookup(props.publicKey)

  return record && record.domain ? (
    <span style={{ userSelect: "text" }}>{record.domain}</span>
  ) : (
    <Address address={props.publicKey} variant="short" />
  )
})
