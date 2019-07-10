import React from "react"
import { Operation, Transaction, Server } from "stellar-sdk"
import { InputAdornment, InputLabel, Input } from "@material-ui/core"
import DialogContent from "@material-ui/core/DialogContent"
import DialogTitle from "@material-ui/core/DialogTitle"
import TextField from "@material-ui/core/TextField"
import DestinationIcon from "@material-ui/icons/Place"
import { useIsMobile, ObservedAccountData } from "../../hooks"
import { Account } from "../../context/accounts"
import { isPublicKey } from "../../lib/stellar-address"
import TransactionSender from "../TransactionSender"
import { VerticalLayout } from "../Layout/Box"
import { createTransaction } from "../../lib/transaction"
import { renderFormFieldError } from "../../lib/errors"
import { QRReader } from "../Form/FormFields"
import { CopyableAddress } from "../PublicKey"
import { ActionButton, CloseButton, DialogActionsBox } from "./Generic"

interface Props {
  account: Account
  accountData: ObservedAccountData
  horizon: Server
  onClose: () => void
  onSubmit: () => void
  sendTransaction: (transaction: Transaction) => void
}

function InflationDestinationDialog(props: Props) {
  const [destination, setDestination] = React.useState("")
  const [error, setError] = React.useState<Error | null>(null)

  const isSmallScreen = useIsMobile()

  const validateDestination = () => {
    if (destination === "") {
      setError(new Error("No destination has been entered."))
      return false
    } else if (!isPublicKey(destination)) {
      setError(new Error("Invalid stellar account id."))
      return false
    } else if (props.accountData.inflation_destination === destination) {
      setError(new Error("Same inflation destination selected."))
      return false
    } else {
      setError(null)
      return true
    }
  }

  const submitTransaction = async () => {
    const { accountData, horizon } = props
    const transaction = await createTransaction(
      [
        Operation.setOptions({
          source: props.account.publicKey,
          inflationDest: destination
        })
      ],
      { accountData, horizon, walletAccount: props.account }
    )

    await props.sendTransaction(transaction)
    setTimeout(props.onClose, 1000)
  }

  const onSubmit = () => {
    if (validateDestination()) {
      submitTransaction()
    }
  }

  const CurrentInflationDestinationComponent = React.useCallback(
    () => (
      <CopyableAddress
        address={props.accountData.inflation_destination ? props.accountData.inflation_destination : ""}
        variant="full"
      />
    ),
    [props.accountData.inflation_destination]
  )

  return (
    <VerticalLayout minWidth={isSmallScreen ? 120 : 250}>
      <DialogTitle>Set inflation destination</DialogTitle>
      <DialogContent>
        <form style={{ minWidth: isSmallScreen ? 120 : 400 }} onSubmit={onSubmit}>
          {props.accountData.inflation_destination && (
            <>
              <InputLabel style={{ overflow: "visible", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Current inflation destination
              </InputLabel>
              <br />
              <Input
                disableUnderline
                inputComponent={CurrentInflationDestinationComponent}
                style={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  fontSize: isSmallScreen ? 12 : 14,
                  wordBreak: "break-word"
                }}
              />
            </>
          )}
          <TextField
            error={Boolean(error)}
            label={error ? renderFormFieldError(error) : "Destination address"}
            placeholder="GABCDEFGHIJK... or alice*example.org"
            fullWidth
            autoFocus={process.env.PLATFORM !== "ios"}
            margin="normal"
            value={destination}
            onChange={event => setDestination(event.target.value)}
            inputProps={{
              style: { textOverflow: "ellipsis" }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment disableTypography position="end">
                  <QRReader iconStyle={{ fontSize: 20 }} onScan={key => setDestination(key)} />
                </InputAdornment>
              )
            }}
          />
          <DialogActionsBox smallDialog>
            <CloseButton onClick={props.onClose} />
            <ActionButton icon={<DestinationIcon />} onClick={onSubmit} type="primary">
              Set destination
            </ActionButton>
          </DialogActionsBox>
        </form>
      </DialogContent>
    </VerticalLayout>
  )
}

interface InflationDestinationContainerProps {
  account: Account
  accountData: ObservedAccountData
  onClose: () => void
  onSubmit: () => void
}

function InflationDestinationContainer(props: InflationDestinationContainerProps) {
  return (
    <TransactionSender account={props.account}>
      {txContext => <InflationDestinationDialog {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default InflationDestinationContainer
