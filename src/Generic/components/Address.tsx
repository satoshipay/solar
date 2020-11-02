import React from "react"
import ButtonBase from "@material-ui/core/ButtonBase"
import Typography from "@material-ui/core/Typography"
import { AccountsContext } from "~App/contexts/accounts"
import { useFederationLookup } from "../hooks/stellar"
import { useClipboard } from "../hooks/userinterface"
import { isPublicKey } from "../lib/stellar-address"
import { useAccountHomeDomainSafe } from "../hooks/stellar"
import { useWellKnownAccounts } from "../hooks/stellar-ecosystem"

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
  testnet: boolean
}

// tslint:disable-next-line no-shadowed-variable
const PublicKey = React.memo(function PublicKey(props: PublicKeyProps) {
  const { variant = "full" } = props
  const digits = getDigitCounts(props.variant)
  const { accounts } = React.useContext(AccountsContext)

  const matchingLocalAccount = accounts.find(
    account => account.publicKey === props.publicKey && account.testnet === props.testnet
  )

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

interface AddressContentProps {
  /** Account ID (public key) or stellar address (alice*example.com) */
  address: string
  variant?: Variant
  style?: React.CSSProperties
  testnet: boolean
}

// tslint:disable-next-line no-shadowed-variable
const AddressContent = React.memo(function AddressContent(props: AddressContentProps) {
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
          {formattedStellarAddress} ({<PublicKey publicKey={props.address} testnet={props.testnet} variant="shorter" />}
          )
        </span>
      )
    } else {
      return (
        <PublicKey
          publicKey={props.address}
          style={{ fontWeight: "inherit" }}
          testnet={props.testnet}
          variant={props.variant}
        />
      )
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

interface ClickableAddressProps extends AddressContentProps {
  icon?: React.ReactNode
  onClick?: () => void
}

// tslint:disable-next-line no-shadowed-variable
const ClickableAddress = React.memo(function ClickableAddress(props: ClickableAddressProps) {
  return (
    <ButtonBase onClick={props.onClick} style={{ fontSize: "inherit", fontWeight: "inherit", textAlign: "inherit" }}>
      <AddressContent {...props} />
      {props.icon ? (
        <>
          &nbsp;
          {props.icon}
        </>
      ) : null}
    </ButtonBase>
  )
})

interface CopyableAddressProps extends AddressContentProps {
  onClick?: () => void
}

// tslint:disable-next-line no-shadowed-variable
const CopyableAddress = React.memo(function CopyableAddress(props: CopyableAddressProps) {
  const { onClick } = props
  const clipboard = useClipboard()

  const handleClick = React.useCallback(() => {
    if (onClick) {
      onClick()
    }
    clipboard.copyToClipboard(props.address)
  }, [clipboard, onClick, props.address])

  return <ClickableAddress {...props} onClick={handleClick} />
})

interface AddressProps {
  address: string
  copy?: boolean
  icon?: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
  testnet: boolean
  variant?: Variant
}

const Address = React.memo(function Address(props: AddressProps) {
  const { address, copy, icon, onClick, style, testnet, variant = "short" } = props

  const accountID = isPublicKey(address) ? address : undefined
  const homeDomain = useAccountHomeDomainSafe(accountID, testnet, true)

  const wellknownAccounts = useWellKnownAccounts(testnet)
  const record = wellknownAccounts.lookup(address)

  if (copy) {
    return <CopyableAddress address={address} onClick={onClick} style={style} testnet={testnet} variant={variant} />
  } else if (onClick) {
    return <ClickableAddress address={address} icon={icon} onClick={onClick} testnet={testnet} variant={variant} />
  } else if (record && record.domain) {
    return <span style={{ userSelect: "text", ...style }}>{record.domain}</span>
  } else if (homeDomain) {
    return <span style={{ userSelect: "text", ...style }}>{homeDomain}</span>
  } else {
    return <AddressContent address={address} style={style} testnet={testnet} variant={variant} />
  }
})

export default Address
