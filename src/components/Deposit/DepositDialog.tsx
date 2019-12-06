import React from "react"
import { Account } from "../../context/accounts"
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
  return (
    <DialogBody
      top={
        <MainTitle
          title={<span>Deposit funds {props.account.testnet ? <TestnetBadge style={{ marginLeft: 8 }} /> : null}</span>}
          onBack={props.onClose}
        />
      }
    >
      <Box margin="24px 0 0">{null}</Box>
      <LumenDepositOptions account={props.account} onCloseDialog={props.onClose} />
    </DialogBody>
  )
}

export default DepositDialog
