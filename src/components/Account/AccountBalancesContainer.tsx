import React from "react"
import Typography from "@material-ui/core/Typography"
import { useIsMobile } from "../../hooks"

function AccountBalancesContainer(props: { children: React.ReactNode }) {
  const isSmallScreen = useIsMobile()
  return (
    <Typography
      color="inherit"
      component="div"
      variant="body2"
      style={{
        marginTop: 12,
        marginLeft: isSmallScreen ? 0 : 42,
        fontSize: isSmallScreen ? 16 : 18
      }}
    >
      {props.children}
    </Typography>
  )
}

export default AccountBalancesContainer
