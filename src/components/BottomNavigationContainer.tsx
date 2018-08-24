import React from "react"
import { Box, VerticalLayout } from "./Layout/Box"

const BottomNavigationContainer = (props: { children: React.ReactNode; navigation: React.ReactNode }) => {
  return (
    <VerticalLayout width="100%" height="100%">
      <Box grow overflow="auto">
        {props.children}
      </Box>
      <Box style={{ flexGrow: 0, flexShrink: 0, zIndex: 1 }}>{props.navigation}</Box>
    </VerticalLayout>
  )
}

export default BottomNavigationContainer
