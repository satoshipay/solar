import React from "react"
import { makeStyles } from "@material-ui/core/styles"
import SendIcon from "@material-ui/icons/Send"
import { Account } from "../../context/accounts"
import { useLiveAccountData } from "../../hooks/stellar-subscriptions"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import QRCodeIcon from "../Icon/QRCode"

export const useButtonStyles = makeStyles(theme => ({
  desktop: {
    margin: "0",
    padding: "24px 0 0",

    "& $button:last-child:not(:first-child)": {
      marginLeft: 40
    }
  },
  mobile: {},
  hidden: {
    paddingTop: 0
  },
  collapse: {
    width: "100%",
    zIndex: 1
  },
  button: {
    border: "none",
    borderRadius: 8,
    boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
    fontSize: "1rem",
    flexBasis: 1,
    flexGrow: 1,
    padding: "20px !important"
  },
  secondaryButton: {
    background: "white",
    color: theme.palette.primary.dark
  }
}))

interface AccountActionsProps {
  account: Account
  bottomOfScreen?: boolean
  hidden?: boolean
  onCreatePayment: () => void
  onReceivePayment: () => void
}

function AccountActions(props: AccountActionsProps) {
  const accountData = useLiveAccountData(props.account.publicKey, props.account.testnet)
  const classes = useButtonStyles()
  const className = `${props.bottomOfScreen ? classes.mobile : classes.desktop} ${props.hidden ? classes.hidden : ""}`
  return (
    <DialogActionsBox className={className} hidden={props.hidden}>
      <ActionButton
        className={`${classes.button} ${classes.secondaryButton}`}
        icon={<QRCodeIcon style={{ fontSize: "110%" }} />}
        onClick={props.onReceivePayment}
        variant="contained"
      >
        Receive
      </ActionButton>
      <ActionButton
        className={classes.button}
        disabled={accountData.balances.length === 0}
        icon={<SendIcon style={{ fontSize: "110%" }} />}
        onClick={props.onCreatePayment}
        type="primary"
      >
        Send
      </ActionButton>
    </DialogActionsBox>
  )
}

export default React.memo(AccountActions)
