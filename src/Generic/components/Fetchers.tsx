import React from "react"
import { useAccountHomeDomainSafe } from "../hooks/stellar"
import { AccountRecord, useWellKnownAccounts } from "../hooks/stellar-ecosystem"
import { Address } from "./PublicKey"

interface AccountNameProps {
  publicKey: string
  testnet: boolean
}

export const AccountName = React.memo(function AccountName(props: AccountNameProps) {
  const wellknownAccounts = useWellKnownAccounts()
  const homeDomain = useAccountHomeDomainSafe(props.publicKey, props.testnet, true)
  const [record, setRecord] = React.useState<AccountRecord | undefined>(undefined)

  React.useEffect(() => {
    wellknownAccounts.lookup(props.publicKey).then(setRecord)
  }, [props.publicKey, wellknownAccounts])

  if (record && record.domain) {
    return <span style={{ userSelect: "text" }}>{record.domain}</span>
  } else if (homeDomain) {
    return <span style={{ userSelect: "text" }}>{homeDomain}</span>
  } else {
    return <Address address={props.publicKey} testnet={props.testnet} variant="short" />
  }
})
