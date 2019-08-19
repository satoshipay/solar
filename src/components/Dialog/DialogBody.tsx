import React from "react"
import { useIsMobile, RefStateObject } from "../../hooks"
import ErrorBoundary from "../ErrorBoundary"
import { Box, VerticalLayout } from "../Layout/Box"

const isRefStateObject = (thing: any): thing is RefStateObject =>
  thing && "element" in thing && typeof thing.update === "function"

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
  actions?: React.ReactNode | RefStateObject
  background?: React.ReactNode
  children: React.ReactNode
  excessWidth?: number
  top?: React.ReactNode
}

function DialogBody(props: Props) {
  const isSmallScreen = useIsMobile()
  const excessWidth = props.excessWidth || 0

  const topContent = React.useMemo(
    () =>
      props.top ? (
        <Box grow={0} position="relative" shrink={0} width="100%">
          {props.top}
        </Box>
      ) : null,
    [props.top]
  )

  const actionsContent = React.useMemo(
    () =>
      props.actions ? (
        <Box
          grow={0}
          position="relative"
          ref={isRefStateObject(props.actions) ? props.actions.update : undefined}
          shrink={0}
          width="100%"
        >
          {isRefStateObject(props.actions) ? null : props.actions}
        </Box>
      ) : null,
    [props.actions]
  )

  const background = React.useMemo(
    () => (props.background ? <Background opacity={0.08}>{props.background}</Background> : null),
    [props.background]
  )

  return (
    <ErrorBoundary>
      <VerticalLayout
        width="100%"
        height="100%"
        maxWidth={900}
        padding={isSmallScreen ? "24px" : " 24px 32px"}
        margin="0 auto"
      >
        {topContent}
        {background}
        <VerticalLayout
          grow
          margin={`0 -${excessWidth}px`}
          maxHeight="100%"
          overflowX="hidden"
          overflowY="auto"
          padding={`0 ${excessWidth}px`}
          shrink
          width="100%"
        >
          {props.children}
          {isSmallScreen ? null : actionsContent}
        </VerticalLayout>
        {isSmallScreen ? actionsContent : null}
      </VerticalLayout>
    </ErrorBoundary>
  )
}

export default React.memo(DialogBody)
