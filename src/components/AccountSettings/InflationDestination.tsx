import React from "react"
import { Operation, Transaction, Server } from "stellar-sdk"
import TextField from "@material-ui/core/TextField"
import ClearIcon from "@material-ui/icons/Clear"
import CheckIcon from "@material-ui/icons/Check"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { useWellKnownAccounts } from "../../hooks/stellar-ecosystem"
import { useLiveAccountData, ObservedAccountData } from "../../hooks/stellar-subscriptions"
import { useIsMobile, useRouter } from "../../hooks/userinterface"
import { isPublicKey } from "../../lib/stellar-address"
import { createTransaction } from "../../lib/transaction"
import TransactionSender from "../TransactionSender"
import { VerticalLayout } from "../Layout/Box"
import DialogBody from "../Dialog/DialogBody"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import MainTitle from "../MainTitle"
import InflationExplanation from "./InflationExplanation"

function validateDestination(accountData: ObservedAccountData, newDestination: string) {
  if (newDestination === "") {
    throw Error("No destination has been entered.")
  } else if (!isPublicKey(newDestination)) {
    throw Error("Invalid stellar account id.")
  } else if (accountData.inflation_destination === newDestination) {
    throw Error("Same inflation destination selected.")
  }
}

interface InflationDestinationDialogProps {
  account: Account
  horizon: Server
  onClose: () => void
  sendTransaction: (transaction: Transaction) => void
}

function clearTextSelection() {
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
  }
}

function InflationDestinationDialog(props: InflationDestinationDialogProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const wellKnownAccounts = useWellKnownAccounts(props.account.testnet)
  const router = useRouter()
  const isSmallScreen = useIsMobile()

  const [destination, setDestination] = React.useState(accountData.inflation_destination || "")
  const [error, setError] = React.useState<Error | null>(null)

  const hasBeenEditedRef = React.useRef(false)
  const hasBeenEdited = hasBeenEditedRef.current

  React.useEffect(() => {
    return router.history.listen(() => {
      clearTextSelection()
    })
  }, [])

  const handleDestinationEditing = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(event.target.value)
    hasBeenEditedRef.current = true
  }, [])

  const submitTransaction = async (newDestination: string) => {
    const transaction = await createTransaction(
      [
        Operation.setOptions({
          source: props.account.publicKey,
          inflationDest: newDestination
        })
      ],
      { accountData, horizon: props.horizon, walletAccount: props.account }
    )

    await props.sendTransaction(transaction)
    setTimeout(props.onClose, 1000)
  }

  const applyInflationDestination = () => {
    const newDestination = destination || ""
    try {
      validateDestination(accountData, newDestination)
      setError(null)

      submitTransaction(newDestination).catch(trackError)
    } catch (error) {
      setError(error)
    }
  }

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        applyInflationDestination()
      } else if (event.key === "Escape") {
        setDestination(accountData.inflation_destination ? accountData.inflation_destination : "")
        clearTextSelection()
      }
    },
    [accountData, destination]
  )

  const cancelEditing = React.useCallback(() => {
    setDestination(accountData.inflation_destination || "")
    setError(null)
    clearTextSelection()
    hasBeenEditedRef.current = false
  }, [accountData])

  const actions = React.useMemo(
    () => (
      <>
        <ActionButton
          icon={<ClearIcon />}
          onClick={hasBeenEditedRef.current ? cancelEditing : props.onClose}
          type="secondary"
        >
          Cancel
        </ActionButton>
        <ActionButton
          disabled={!destination || destination === accountData.inflation_destination}
          icon={<CheckIcon />}
          onClick={applyInflationDestination}
          type="primary"
        >
          Submit
        </ActionButton>
      </>
    ),
    [accountData, applyInflationDestination, cancelEditing, destination]
  )

  const value = hasBeenEdited ? destination : accountData.inflation_destination || ""
  const wellKnownAccount = props.account.testnet ? undefined : wellKnownAccounts.lookup(value)

  return (
    <DialogBody
      top={<MainTitle hideBackButton={!props.onClose} onBack={props.onClose} title="Edit Inflation Destination" />}
      actions={<DialogActionsBox smallDialog>{actions}</DialogActionsBox>}
    >
      <VerticalLayout alignItems="center" margin={isSmallScreen ? "32px 0 0" : "32px auto 0"} maxWidth={700}>
        <TextField
          autoFocus
          error={Boolean(error)}
          fullWidth
          label={error ? error.message : "Inflation destination"}
          helperText={wellKnownAccount ? `${wellKnownAccount.name} (${wellKnownAccount.domain})` : undefined}
          inputProps={{
            style: { textOverflow: "ellipsis" }
          }}
          onChange={handleDestinationEditing}
          onKeyDown={handleKeyDown}
          placeholder="GABCDEFGHIJK... or pool*example.org"
          value={value}
          style={{ flexShrink: 0 }}
        />
        <InflationExplanation style={{ marginTop: 32 }} />
      </VerticalLayout>
    </DialogBody>
  )
}

interface InflationDestinationContainerProps {
  account: Account
  onClose: () => void
}

function InflationDestinationContainer(props: InflationDestinationContainerProps) {
  return (
    <TransactionSender account={props.account}>
      {txContext => <InflationDestinationDialog {...props} {...txContext} />}
    </TransactionSender>
  )
}

export default InflationDestinationContainer
