import React from "react"
import { Horizon } from "stellar-sdk"
import Avatar from "@material-ui/core/Avatar"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { brandColor } from "../../theme"
import LumenIcon from "../Icon/Lumen"

const useAssetLogoStyles = makeStyles({
  imageAvatar: {
    backgroundColor: "white"
  },
  textAvatar: {
    background: `linear-gradient(145deg, ${brandColor.main} 0%, ${brandColor.dark} 35%, ${brandColor.dark} 75%, ${
      brandColor.main
    } 100%)`,
    border: "1px solid rgba(255, 255, 255, 0.66)",
    color: "rgba(255, 255, 255, 1)",
    fontSize: 12,
    fontWeight: 500
  },
  darkTextAvatar: {
    background: brandColor.dark,
    border: `1px solid ${brandColor.main15}`
  },
  xlmAvatar: {
    background: "white",
    color: "black"
  },
  icon: {
    width: "100%",
    height: "100%"
  }
})

interface Props {
  balance: Horizon.BalanceLine
  className?: string
  dark?: boolean
  imageURL?: string
  style?: React.CSSProperties
}

function AssetLogo(props: Props) {
  const className = props.className || ""
  const classes = useAssetLogoStyles({})

  if (props.balance.asset_type === "native") {
    return (
      <Avatar alt="Stellar Lumens (XLM)" className={`${className} ${classes.xlmAvatar}`} style={props.style}>
        <LumenIcon className={classes.icon} />
      </Avatar>
    )
  } else {
    const avatarClassName = [
      className,
      props.imageURL ? classes.imageAvatar : classes.textAvatar,
      props.dark && !props.imageURL ? classes.darkTextAvatar : ""
    ].join(" ")
    return (
      <Avatar alt={name} className={avatarClassName} style={props.style}>
        {props.imageURL ? <img className={classes.icon} src={props.imageURL} /> : props.balance.asset_code}
      </Avatar>
    )
  }
}

export default React.memo(AssetLogo)
