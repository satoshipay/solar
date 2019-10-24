import React from "react"
import { Account } from "../../context/accounts"
import { useDialogActions } from "../../hooks/userinterface"
import DialogBody from "../Dialog/DialogBody"
import TestnetBadge from "../Dialog/TestnetBadge"
import { Box } from "../Layout/Box"
import MainTitle from "../MainTitle"
import LumenDepositOptions from "./LumenDepositOptions"

interface Props {
  account: Account
  onClose: () => void
}

function DepositDialog(props: Props) {
  const dialogActionsRef = useDialogActions()

  return (
    <DialogBody
      top={
        <MainTitle
          title={<span>Deposit funds {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}</span>}
          onBack={props.onClose}
        />
      }
      actions={dialogActionsRef}
    >
      <Box margin="24px 0 0">{null}</Box>
      <LumenDepositOptions account={props.account} />
    </DialogBody>
  )
}

export default DepositDialog
