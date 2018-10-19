import React from "react"
import CardActionArea from "@material-ui/core/CardActionArea"
import CardContent from "@material-ui/core/CardContent"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import { CardListCard } from "../CardList"

interface ConditionalActionAreaProps {
  children: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
}

const ConditionalActionArea = (props: ConditionalActionAreaProps) => {
  return props.onClick ? (
    <CardActionArea onClick={props.onClick} style={{ width: "100%", height: "100%", ...props.style }}>
      {props.children}
    </CardActionArea>
  ) : (
    <div style={props.style}>{props.children}</div>
  )
}

interface SignerCardProps {
  children: React.ReactNode
  icon: React.ReactElement<any>
  onClick?: () => void
}

const SignerCard = (props: SignerCardProps) => {
  const clickAreaStyle = { display: "flex", alignItems: "center", minHeight: 104, padding: "0 16px" }
  return (
    <CardListCard>
      <ConditionalActionArea onClick={props.onClick} style={clickAreaStyle}>
        <>
          <div style={{ display: "flex", flexGrow: 0, flexShrink: 0, justifyContent: "center", alignItems: "center" }}>
            <ListItemIcon>{props.icon}</ListItemIcon>
          </div>
          <CardContent style={{ position: "relative", flexGrow: 1, paddingTop: 16, paddingBottom: 16 }}>
            {props.children}
          </CardContent>
        </>
      </ConditionalActionArea>
    </CardListCard>
  )
}

export default SignerCard
