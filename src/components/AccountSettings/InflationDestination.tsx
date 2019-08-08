import React from "react"
import { Operation, Transaction, Server } from "stellar-sdk"
import { InputLabel } from "@material-ui/core"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import ClearIcon from "@material-ui/icons/Clear"
import CheckIcon from "@material-ui/icons/Check"
import EditIcon from "@material-ui/icons/Edit"
import { useAccountData, useIsMobile, useRouter, ObservedAccountData } from "../../hooks"
import { Account } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import { isPublicKey } from "../../lib/stellar-address"
import TransactionSender from "../TransactionSender"
import { VerticalLayout, Box } from "../Layout/Box"
import { createTransaction } from "../../lib/transaction"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import MainTitle from "../MainTitle"

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
  const accountData = useAccountData(props.account.publicKey, props.account.testnet)
  const router = useRouter()
  const isSmallScreen = useIsMobile()

  const [destination, setDestination] = React.useState(() => accountData.inflation_destination)
  const [error, setError] = React.useState<Error | null>(null)
  const [mode, setMode] = React.useState<"editing" | "readonly">("readonly")

  const readonlyDisplayName = destination || accountData.inflation_destination || "No inflation destination set."

  const switchToEditMode = React.useCallback(() => setMode("editing"), [])

  React.useEffect(() => {
    return router.history.listen(() => {
      setMode("readonly")
      clearTextSelection()
    })
  }, [])

  const handleDestinationEditing = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(event.target.value)
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
        setMode("readonly")
        clearTextSelection()
      }
    },
    [accountData, destination]
  )

  const cancelEditing = React.useCallback(
    () => {
      setDestination(undefined)
      setError(null)
      setMode("readonly")
      clearTextSelection()
    },
    [accountData]
  )

  const editableActions = React.useMemo(
    () => (
      <>
        <ActionButton icon={<ClearIcon />} onClick={cancelEditing} type="secondary">
          Cancel
        </ActionButton>
        <ActionButton icon={<CheckIcon />} onClick={applyInflationDestination} type="primary">
          Submit
        </ActionButton>
      </>
    ),
    [cancelEditing, applyInflationDestination]
  )

  const readonlyActions = React.useMemo(
    () => (
      <ActionButton onClick={switchToEditMode} icon={<EditIcon />} type="primary">
        Edit
      </ActionButton>
    ),
    []
  )

  return (
    <Box width="100%" maxWidth={900} padding="32px" margin="0 auto">
      <Box margin="0 0 32px">
        <MainTitle
          hideBackButton={!props.onClose}
          onBack={props.onClose}
          title={accountData.inflation_destination ? "Change Inflation Pool" : "Join Inflation Pool"}
        />
      </Box>
      <VerticalLayout minWidth={isSmallScreen ? 120 : 250}>
        <DialogContent>
          <InputLabel
            style={{
              overflow: "visible",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              color: error ? "red" : undefined
            }}
          >
            {error ? error.message : "Inflation destination"}
          </InputLabel>
          <TextField
            autoFocus
            disabled={mode === "readonly"}
            error={Boolean(error)}
            fullWidth
            onChange={handleDestinationEditing}
            onKeyDown={handleKeyDown}
            placeholder="GABCDEFGHIJK... or pool*example.org"
            value={mode === "readonly" ? readonlyDisplayName : destination}
          />
          <DialogActionsBox smallDialog>{mode === "editing" ? editableActions : readonlyActions}</DialogActionsBox>
        </DialogContent>
      </VerticalLayout>
    </Box>
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
