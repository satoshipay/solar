import React from "react"
import Typography from "@material-ui/core/Typography"
import { Account } from "~App/contexts/accounts"
import * as routes from "~App/routes"
import { useRouter, RefStateObject } from "~Generic/hooks/userinterface"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { Box } from "~Layout/components/Box"
import Portal from "~Generic/components/Portal"

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
