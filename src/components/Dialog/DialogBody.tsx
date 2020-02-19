import React from "react"
import CircularProgress from "@material-ui/core/CircularProgress"
import { makeStyles } from "@material-ui/core/styles"
import { useIsMobile, RefStateObject } from "../../hooks/userinterface"
import { MobileKeyboardOpenedSelector } from "../../theme"
import ErrorBoundary from "../ErrorBoundary"
import { Box, VerticalLayout } from "../Layout/Box"
import { Section } from "../Layout/Page"

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

const useDialogBodyStyles = makeStyles({
  actions: {
    [MobileKeyboardOpenedSelector()]: {
      display: "none !important"
    }
  }
})

const topStyle: React.CSSProperties = {
  flexGrow: 0,
  flexShrink: 0,
  position: "relative",
  width: "100%",
  zIndex: 1
}

interface Props {
  actions?: React.ReactNode | RefStateObject
  actionsPosition?: "after-content" | "bottom"
  brandColored?: boolean
  background?: React.ReactNode
  backgroundColor?: React.CSSProperties["backgroundColor"]
  children: React.ReactNode
  excessWidth?: number
  fitToShrink?: boolean
  preventActionsPlaceholder?: boolean
  preventNotch?: boolean
  top?: React.ReactNode
}

function DialogBody(props: Props) {
  const classes = useDialogBodyStyles()
  const isSmallScreen = useIsMobile()

  const actionsPosition = isSmallScreen ? "bottom" : props.actionsPosition || "after-content"
  const excessWidth = props.excessWidth || 0

  const topContent = React.useMemo(() => (props.top ? <Box style={topStyle}>{props.top}</Box> : null), [props.top])

  const actionsContent = React.useMemo(
    () =>
      props.actions ? (
        <Box
          basis={isSmallScreen && !props.preventActionsPlaceholder ? 80 : undefined}
          className={classes.actions}
          grow={0}
          position="relative"
          ref={isRefStateObject(props.actions) ? props.actions.update : undefined}
          shrink={0}
          width="100%"
        >
          {isRefStateObject(props.actions) ? null : props.actions}
        </Box>
      ) : null,
    [classes.actions, isSmallScreen, props.actions, props.preventActionsPlaceholder]
  )

  const background = React.useMemo(
    () => (props.background ? <Background opacity={0.08}>{props.background}</Background> : null),
    [props.background]
  )

  return (
    <ErrorBoundary>
      <Section
        alignItems="stretch"
        brandColored={props.brandColored}
        backgroundColor={props.backgroundColor}
        display="flex"
        height="100%"
        margin="0 auto"
        maxWidth={900}
        overflowX="hidden"
        padding={isSmallScreen ? "12px 24px" : "24px 32px"}
        style={{ flexDirection: "column" }}
        top={!props.preventNotch}
        width="100%"
      >
        <React.Suspense fallback={<CircularProgress style={{ alignSelf: "center", justifySelf: "center" }} />}>
          {topContent}
          {background}
          <VerticalLayout
            grow={props.fitToShrink ? 0 : 1}
            margin={`0 -${excessWidth}px`}
            maxHeight="100%"
            overflowX="hidden"
            overflowY="auto"
            padding={`0 ${excessWidth}px`}
            position="relative"
            shrink
          >
            {props.children}
            {actionsPosition === "after-content" ? actionsContent : null}
          </VerticalLayout>
          {actionsPosition === "bottom" ? actionsContent : null}
        </React.Suspense>
      </Section>
    </ErrorBoundary>
  )
}

export default React.memo(DialogBody)
