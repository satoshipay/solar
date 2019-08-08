import React from "react"
import { Operation, Transaction, Server } from "stellar-sdk"
import { InputLabel } from "@material-ui/core"
import DialogContent from "@material-ui/core/DialogContent"
import TextField from "@material-ui/core/TextField"
import ClearIcon from "@material-ui/icons/Clear"
import CheckIcon from "@material-ui/icons/Check"
import EditIcon from "@material-ui/icons/Edit"
import { useAccountData, useIsMobile, useRouter } from "../../hooks"
import { Account } from "../../context/accounts"
import { isPublicKey } from "../../lib/stellar-address"
import TransactionSender from "../TransactionSender"
import { VerticalLayout, Box } from "../Layout/Box"
import { createTransaction } from "../../lib/transaction"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import MainTitle from "../MainTitle"

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

  const [destination, setDestination] = React.useState("")
  const [error, setError] = React.useState<Error | null>(null)
  const [mode, setMode] = React.useState<"editing" | "readonly">("readonly")

  React.useEffect(() => {
    return router.history.listen(() => {
      setMode("readonly")
      clearTextSelection()
    })
  }, [])

  const handleDestinationEditing = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(event.target.value)
  }, [])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        changeInflationDestination(destination)
      } else if (event.key === "Escape") {
        setDestination(accountData.inflation_destination ? accountData.inflation_destination : "")
        setMode("readonly")
        clearTextSelection()
      }
    },
    [accountData, destination]
  )

  const applyDestination = React.useCallback(
    () => {
      changeInflationDestination(destination)
    },
    [destination]
  )

  const cancelEditing = React.useCallback(
    () => {
      setDestination("")
      setError(null)
      setMode("readonly")
      clearTextSelection()
    },
    [accountData]
  )

  const switchToEditMode = React.useCallback(() => {
    setMode("editing")
  }, [])

  const editableActions = React.useMemo(
    () => (
      <>
        <ActionButton icon={<ClearIcon />} onClick={cancelEditing} type="secondary">
          Cancel
        </ActionButton>
        <ActionButton icon={<CheckIcon />} onClick={applyDestination} type="primary">
          Submit
        </ActionButton>
      </>
    ),
    [applyDestination, cancelEditing]
  )

  const readonlyActions = React.useMemo(
    () => (
      <ActionButton onClick={switchToEditMode} icon={<EditIcon />} type="primary">
        Edit
      </ActionButton>
    ),
    []
  )

  const getDisplayName = () => {
    if (destination === "") {
      if (accountData.inflation_destination === undefined) {
        return "No inflation destination set."
      } else {
        return accountData.inflation_destination
      }
    } else {
      return destination
    }
  }

  const changeInflationDestination = (newDestination: string) => {
    if (validateDestination(newDestination)) {
      submitTransaction(newDestination)
    }
  }

  const validateDestination = (newDestination: string) => {
    if (newDestination === "") {
      setError(new Error("No destination has been entered."))
      return false
    } else if (!isPublicKey(newDestination)) {
      setError(new Error("Invalid stellar account id."))
      return false
    } else if (accountData.inflation_destination === newDestination) {
      setError(new Error("Same inflation destination selected."))
      return false
    } else {
      setError(null)
      return true
    }
  }

  const submitTransaction = async (newDestination: string) => {
    const { horizon } = props
    const transaction = await createTransaction(
      [
        Operation.setOptions({
          source: props.account.publicKey,
          inflationDest: newDestination
        })
      ],
      { accountData, horizon, walletAccount: props.account }
    )

    await props.sendTransaction(transaction)
    setTimeout(props.onClose, 1000)
  }

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
            fullWidth
            onChange={handleDestinationEditing}
            onKeyDown={handleKeyDown}
            placeholder="GABCDEFGHIJK... or example.org"
            value={mode === "readonly" ? getDisplayName() : destination}
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
