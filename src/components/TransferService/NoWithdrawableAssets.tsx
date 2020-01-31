import React from "react"
import Typography from "@material-ui/core/Typography"
import { Account } from "../../context/accounts"
import { useRouter, RefStateObject } from "../../hooks/userinterface"
import * as routes from "../../routes"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import { Box } from "../Layout/Box"
import Portal from "../Portal"

interface Props {
  account: Account
  actionsRef: RefStateObject
  margin?: string
}

function NoWithdrawableAssets(props: Props) {
  const router = useRouter()
  return (
    <Box margin={props.margin} textAlign="center">
      <Typography>This account holds no withdrawable assets.</Typography>
      <Portal desktop="inline" target={props.actionsRef.element}>
        <DialogActionsBox>
          <ActionButton
            autoFocus
            onClick={() => router.history.push(routes.manageAccountAssets(props.account.id))}
            type="primary"
          >
            Add asset
          </ActionButton>
        </DialogActionsBox>
      </Portal>
    </Box>
  )
}

export default React.memo(NoWithdrawableAssets)
