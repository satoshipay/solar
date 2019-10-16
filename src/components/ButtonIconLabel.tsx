import React from "react"
import CircularProgress from "@material-ui/core/CircularProgress"

const Container = (props: { children: React.ReactNode; style?: React.CSSProperties }) => {
  return <span style={{ display: "flex", alignItems: "center", height: 24, ...props.style }}>{props.children}</span>
}

const Icon = (props: { children: React.ReactNode }) => {
  return <span style={{ display: "flex", alignItems: "center", flexGrow: 1, marginRight: 8 }}>{props.children}</span>
}

const Label = (props: { children: React.ReactNode }) => {
  return (
    <span style={{ display: "flex", alignItems: "center", flexGrow: 1, lineHeight: "100%" }}>{props.children}</span>
  )
}

interface Props {
  children?: React.ReactNode | null
  label: React.ReactNode
  loading?: boolean
  loaderColor?: string
  style?: React.CSSProperties
  labelFirst?: boolean
}

const ButtonIconLabel = (props: Props) => {
  const loader = <CircularProgress size="1.2em" style={{ color: props.loaderColor || "white" }} />
  return (
    <Container style={props.style}>
      {props.labelFirst ? (
        <>
          <Label>{props.label}</Label>
          {props.children || props.loading ? <Icon>{props.loading ? loader : props.children}</Icon> : null}
        </>
      ) : (
        <>
          {props.children || props.loading ? <Icon>{props.loading ? loader : props.children}</Icon> : null}
          <Label>{props.label}</Label>
        </>
      )}
    </Container>
  )
}

export default ButtonIconLabel
