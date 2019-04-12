import React from "react"
import Typography from "@material-ui/core/Typography"
import { AccountsContext } from "../context/accounts"
import { queryReverseLookupCache } from "../lib/stellar-address"

type Variant = "full" | "short" | "shorter"

function getDigitCounts(variant?: Variant) {
  if (variant === "short") {
    return {
      leading: 6,
      trailing: 6
    }
  } else {
    return {
      leading: 4,
      trailing: 4
    }
  }
}

function shortenName(name: string, intendedLength: number) {
  if (name.length <= intendedLength) {
    return name
  } else {
    return (
      name.substr(0, intendedLength - 3).trim() +
      "…" +
      name
        .substr(intendedLength - 3)
        .substr(-3)
        .trim()
    )
  }
}

interface PublicKeyProps {
  publicKey: string
  variant?: Variant
  style?: React.CSSProperties
}

export function PublicKey(props: PublicKeyProps) {
  const { variant = "full" } = props
  const digits = getDigitCounts(props.variant)
  const { accounts } = React.useContext(AccountsContext)

  const matchingLocalAccount = accounts.find(account => account.publicKey === props.publicKey)

  const style: React.CSSProperties = {
    display: "inline",
    fontSize: "inherit",
    fontWeight: "bold",
    whiteSpace: variant !== "full" ? "pre" : undefined,
    ...props.style
  }

  if (props.publicKey.length !== 56) {
    return <>{props.publicKey}</>
  } else if (matchingLocalAccount) {
    // Note: We don't check for mainnet/testnet here...
    return (
      <Typography component="span" style={style}>
        {variant === "full"
          ? matchingLocalAccount.name
          : shortenName(matchingLocalAccount.name, digits.leading + digits.trailing + 6)}
      </Typography>
    )
  }
  return (
    <Typography component="span" style={style}>
      {props.variant === "full" || !props.variant
        ? props.publicKey
        : props.publicKey.substr(0, digits.leading) + "…" + props.publicKey.substr(-digits.trailing)}
    </Typography>
  )
}

interface AddressProps {
  /** Account ID (public key) or stellar address (alice*example.com) */
  address: string
  variant?: Variant
  style?: React.CSSProperties
}

export function Address(props: AddressProps) {
  if (props.address.indexOf("*") > -1) {
    return <span style={props.style}>{props.address}</span>
  } else {
    const stellarAddress = queryReverseLookupCache(props.address)

    if (stellarAddress) {
      const formattedStellarAddress =
        props.variant === "full" ? stellarAddress : shortenName(stellarAddress, props.variant === "shorter" ? 8 : 14)

      return (
        <span style={props.style}>
          {formattedStellarAddress} ({<PublicKey publicKey={props.address} variant="shorter" />})
        </span>
      )
    } else {
      return <PublicKey publicKey={props.address} variant={props.variant} />
    }
  }
}
