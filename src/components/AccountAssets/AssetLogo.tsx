import React from "react"
import { Asset } from "stellar-sdk"
import Avatar from "@material-ui/core/Avatar"
import makeStyles from "@material-ui/core/styles/makeStyles"
import { brandColor } from "../../theme"
import LumenIcon from "../Icon/Lumen"

const paddedAssetIconsRegex = /bitbondsto\.com/

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
  longCodeTextAvatar: {
    justifyContent: "flex-start",
    padding: "0 2px"
  },
  darkTextAvatar: {
    background: brandColor.dark,
    border: `1px solid ${brandColor.main15}`
  },
  xlmAvatar: {
    background: "white",
    boxSizing: "border-box",
    color: "black",
    fontSize: 12,
    padding: "0.5em"
  },
  icon: {
    width: "100%",
    height: "100%"
  },
  padding: {
    width: "75%",
    height: "75%"
  }
})

interface Props {
  asset: Asset
  className?: string
  dark?: boolean
  imageURL?: string
  style?: React.CSSProperties
}

function AssetLogo(props: Props) {
  const className = props.className || ""
  const classes = useAssetLogoStyles({})

  if (props.asset.isNative()) {
    return (
      <Avatar alt="Stellar Lumens (XLM)" className={`${className} ${classes.xlmAvatar}`} style={props.style}>
        <LumenIcon className={classes.icon} />
      </Avatar>
    )
  } else {
    const applyPadding = props.imageURL && props.imageURL.match(paddedAssetIconsRegex)
    const assetCode =
      props.asset.code.length < 5 ? props.asset.code : props.asset.code.substr(0, 2) + props.asset.code.substr(-2)

    const avatarClassName = [
      className,
      props.imageURL ? classes.imageAvatar : classes.textAvatar,
      props.dark && !props.imageURL ? classes.darkTextAvatar : ""
    ].join(" ")
    const iconClassName = [classes.icon, applyPadding ? classes.padding : ""].join(" ")
    return (
      <Avatar alt={name} className={avatarClassName} style={props.style}>
        {props.imageURL ? <img className={iconClassName} src={props.imageURL} /> : assetCode}
      </Avatar>
    )
  }
}

export default React.memo(AssetLogo)
