import React from "react"
import Typography from "@material-ui/core/Typography"
import { AccountsContext } from "../context/accounts"

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

interface Props {
  publicKey: string
  variant?: Variant
  style?: React.CSSProperties
}

const PublicKey = (props: Props) => {
  const digits = getDigitCounts(props.variant)
  const { accounts } = React.useContext(AccountsContext)

  const matchingLocalAccount = accounts.find(account => account.publicKey === props.publicKey)
  const style: React.CSSProperties = { display: "inline", fontSize: "inherit", fontWeight: "bold", ...props.style }

  if (props.publicKey.length !== 56) {
    return <>{props.publicKey}</>
  } else if (matchingLocalAccount) {
    // Note: We don't check for mainnet/testnet here...
    return (
      <Typography component="span" style={style}>
        {props.variant === "full" || !props.variant
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

export default PublicKey
