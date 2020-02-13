import Typography from "@material-ui/core/Typography"
import React from "react"
import { useIsMobile } from "../../hooks/userinterface"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import ViewLoading from "../ViewLoading"

export function DesktopTwoColumns(props: { children: React.ReactNode[] }) {
  const isSmallScreen = useIsMobile()

  if (isSmallScreen) {
    return <VerticalLayout>{props.children[0]}</VerticalLayout>
  }

  return (
    <HorizontalLayout alignItems="stretch" height="100%">
      <VerticalLayout
        grow
        minWidth={300}
        maxWidth={400}
        padding={isSmallScreen ? 0 : "4vh 0"}
        overflowY="auto"
        shrink={0}
        width="50%"
      >
        <React.Suspense fallback={<ViewLoading />}>{props.children[0]}</React.Suspense>
      </VerticalLayout>
      <VerticalLayout
        grow
        margin="0 0 0 5%"
        padding="4vh 1vw 4vh 5%"
        shrink
        style={{ borderLeft: "1px solid rgba(0, 0, 0, 0.25)" }}
      >
        {props.children[1]}
      </VerticalLayout>
    </HorizontalLayout>
  )
}

export function Paragraph(props: { children: React.ReactNode }) {
  return (
    <Typography color="textSecondary" style={{ marginBottom: 16 }} variant="body2">
      {props.children}
    </Typography>
  )
}

interface SummaryProps {
  children: React.ReactNode
  headline: React.ReactNode
}

export function Summary(props: SummaryProps) {
  return (
    <>
      <Typography color="textSecondary" style={{ marginTop: 16, marginBottom: 16 }} variant="h6">
        {props.headline}
      </Typography>
      {props.children}
    </>
  )
}
