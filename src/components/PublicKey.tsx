import React from "react"
import ButtonBase from "@material-ui/core/ButtonBase"
import Typography from "@material-ui/core/Typography"
import { AccountsContext } from "../context/accounts"
import { useFederationLookup } from "../hooks/stellar"
import { useClipboard } from "../hooks/userinterface"
import { isPublicKey } from "../lib/stellar-address"

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

// tslint:disable-next-line no-shadowed-variable
export const PublicKey = React.memo(function PublicKey(props: PublicKeyProps) {
  const { variant = "full" } = props
  const digits = getDigitCounts(props.variant)
  const { accounts } = React.useContext(AccountsContext)

  const matchingLocalAccount = accounts.find(account => account.publicKey === props.publicKey)

  const style: React.CSSProperties = {
    display: "inline",
    fontSize: "inherit",
    fontWeight: "bold",
    userSelect: "text",
    WebkitUserSelect: "text",
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
})

interface AddressProps {
  /** Account ID (public key) or stellar address (alice*example.com) */
  address: string
  variant?: Variant
  style?: React.CSSProperties
}

// tslint:disable-next-line no-shadowed-variable
export const Address = React.memo(function Address(props: AddressProps) {
  const { lookupStellarAddress } = useFederationLookup()

  const style: React.CSSProperties = {
    userSelect: "text",
    WebkitUserSelect: "text",
    ...props.style
  }

  if (isPublicKey(props.address)) {
    const stellarAddress = lookupStellarAddress(props.address)

    if (stellarAddress) {
      const formattedStellarAddress =
        props.variant === "full" ? stellarAddress : shortenName(stellarAddress, props.variant === "shorter" ? 8 : 14)

      return (
        <span style={style}>
          {formattedStellarAddress} ({<PublicKey publicKey={props.address} variant="shorter" />})
        </span>
      )
    } else {
      return <PublicKey publicKey={props.address} style={{ fontWeight: "inherit" }} variant={props.variant} />
    }
  } else {
    return props.variant === "short" ? (
      <span style={style}>{shortenName(props.address, 18)}</span>
    ) : props.variant === "shorter" ? (
      <span style={style}>{shortenName(props.address, 14)}</span>
    ) : (
      <span style={style}>{props.address}</span>
    )
  }
})

interface ClickableAddressProps extends AddressProps {
  icon?: React.ReactNode
  onClick?: () => void
}

// tslint:disable-next-line no-shadowed-variable
export const ClickableAddress = React.memo(function ClickableAddress(props: ClickableAddressProps) {
  return (
    <ButtonBase onClick={props.onClick} style={{ fontSize: "inherit", fontWeight: "inherit", textAlign: "inherit" }}>
      <Address {...props} />
      {props.icon ? (
        <>
          &nbsp;
          {props.icon}
        </>
      ) : null}
    </ButtonBase>
  )
})

interface CopyableAddressProps extends AddressProps {
  onClick?: () => void
}

// tslint:disable-next-line no-shadowed-variable
export const CopyableAddress = React.memo(function CopyableAddress(props: CopyableAddressProps) {
  const clipboard = useClipboard()

  const onClick = React.useCallback(() => {
    if (props.onClick) {
      props.onClick()
    }
    clipboard.copyToClipboard(props.address)
  }, [clipboard, props])

  return <ClickableAddress {...props} onClick={onClick} />
})
