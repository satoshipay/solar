import React from "react"
import Typography from "@material-ui/core/Typography"

type Variant = "short" | "shorter"

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

interface Props {
  publicKey: string
  variant: Variant
  style?: React.CSSProperties
}

const ShortPublicKey = ({ publicKey, style, variant }: Props) => {
  const digits = getDigitCounts(variant)

  if (publicKey.length !== 56) {
    return <>{publicKey}</>
  }
  return (
    <Typography component="span" style={{ display: "inline", fontSize: "inherit", fontWeight: "bold", ...style }}>
      {publicKey.substr(0, digits.leading) + "…" + publicKey.substr(-digits.trailing)}
    </Typography>
  )
}

export default ShortPublicKey
