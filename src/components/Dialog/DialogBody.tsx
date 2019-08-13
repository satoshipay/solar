import React from "react"
import { useIsMobile } from "../../hooks"
import ErrorBoundary from "../ErrorBoundary"
import { Box, VerticalLayout } from "../Layout/Box"

function Background(props: { children: React.ReactNode; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: 0.08,
        textAlign: "center",
        zIndex: -1
      }}
    >
      {props.children}
    </div>
  )
}

interface Props {
  background?: React.ReactNode
  bottom?: React.ReactNode
  children: React.ReactNode
  top?: React.ReactNode
}

function DialogBody(props: Props) {
  const isSmallScreen = useIsMobile()

  const topContent = React.useMemo(
    () =>
      props.top ? (
        <Box grow={0} position="relative" shrink={0} width="100%">
          {props.top}
        </Box>
      ) : null,
    [props.top]
  )

  const bottomContent = React.useMemo(
    () =>
      props.bottom ? (
        <Box grow={0} position="relative" shrink={0} width="100%">
          {props.bottom}
        </Box>
      ) : null,
    [props.bottom]
  )

  const background = React.useMemo(
    () => (props.background ? <Background opacity={0.08}>{props.background}</Background> : null),
    [props.background]
  )

  return (
    <ErrorBoundary>
      <VerticalLayout
        width="100%"
        maxHeight="100%"
        maxWidth={900}
        padding={isSmallScreen ? "24px" : " 24px 32px"}
        margin="0 auto"
      >
        {topContent}
        {background}
        <VerticalLayout grow maxHeight="100%" overflowY="auto" shrink width="100%">
          {props.children}
        </VerticalLayout>
        {bottomContent}
      </VerticalLayout>
    </ErrorBoundary>
  )
}

export default React.memo(DialogBody)
