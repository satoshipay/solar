import React from "react"
import IconButton from "@material-ui/core/IconButton"
import Typography, { TypographyProps } from "@material-ui/core/Typography"
import ArrowBackIcon from "@material-ui/icons/KeyboardArrowLeft"
import { useIsMobile } from "../hooks/userinterface"
import { Box, HorizontalLayout } from "~Layout/components/Box"

interface BackButtonProps {
  onClick: () => void
  style?: React.CSSProperties
}

// React.memo()-ing, since for some reason re-rendering the KeyboardArrowLeft icon is slow
const BackButton = React.memo(function BackButton(props: BackButtonProps) {
  const style = {
    padding: 6,
    fontSize: 32,
    ...props.style
  }
  return (
    <IconButton color="inherit" onClick={props.onClick} style={style}>
      <ArrowBackIcon style={{ fontSize: 32 }} />
    </IconButton>
  )
})

interface Props {
  actions?: React.ReactNode
  badges?: React.ReactNode
  hideBackButton?: boolean
  nowrap?: boolean
  onBack: () => void
  style?: React.CSSProperties
  title: React.ReactNode
  titleColor?: TypographyProps["color"]
  titleStyle?: React.CSSProperties
}

function MainTitle(props: Props) {
  const isSmallScreen = useIsMobile()
  const isTitleOnSecondRow = isSmallScreen && props.actions && !props.hideBackButton

  const backButtonStyle = React.useMemo(
    () => ({
      fontSize: 28,
      flexGrow: 0,
      flexShrink: 0,
      marginLeft: isSmallScreen ? -12 : -4,
      marginRight: 6
    }),
    [isSmallScreen]
  )

  return (
    <HorizontalLayout
      alignItems="center"
      wrap={isSmallScreen && !props.nowrap ? (props.hideBackButton ? "wrap-reverse" : "wrap") : "nowrap"}
      style={{ minHeight: isSmallScreen ? undefined : 56, ...props.style }}
    >
      {props.hideBackButton ? null : <BackButton onClick={props.onBack} style={backButtonStyle} />}
      <HorizontalLayout
        alignItems="center"
        grow={isSmallScreen ? 1 : props.badges ? undefined : 1}
        minWidth={isTitleOnSecondRow ? "100%" : undefined}
        maxWidth="100%"
        order={isTitleOnSecondRow ? 4 : undefined}
      >
        <Typography
          variant="h5"
          color={props.titleColor}
          style={{
            flexGrow: 1,
            flexShrink: 1,
            fontSize: isSmallScreen ? 20 : 24,
            height: 48,
            lineHeight: "48px",
            marginRight: 12,
            minWidth: "40%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            ...props.titleStyle
          }}
        >
          {props.title}
        </Typography>
        {props.badges}
      </HorizontalLayout>
      <Box grow={Boolean(props.actions)} style={{ textAlign: "right" }}>
        {props.actions}
      </Box>
    </HorizontalLayout>
  )
}

export default MainTitle
