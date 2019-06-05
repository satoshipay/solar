import React from "react"
import { Horizon, Memo, Transaction } from "stellar-sdk"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Tooltip from "@material-ui/core/Tooltip"
import CheckIcon from "@material-ui/icons/Check"
import UpdateIcon from "@material-ui/icons/Update"
import WarningIcon from "@material-ui/icons/Warning"
import { useIsMobile } from "../../hooks"
import { Account } from "../../context/accounts"
import { getSignerKey, signatureMatchesPublicKey } from "../../lib/stellar"
import { ObservedAccountData } from "../../subscriptions"
import { warningColor } from "../../theme"
import { Address } from "../PublicKey"
import { SummaryDetailsField, SummaryItem } from "./SummaryItem"

export function DangerousTransactionWarning(props: { style?: React.CSSProperties }) {
  return (
    <ListItem style={{ background: warningColor, ...props.style }}>
      <ListItemIcon>
        <WarningIcon />
      </ListItemIcon>
      <ListItemText
        primary="Transaction initiated by unrecognized account"
        secondary="Please review carefully. In case of doubt, prefer dismissing."
      />
    </ListItem>
  )
}

function SignerStatus(props: { hasSigned: boolean; style?: React.CSSProperties }) {
  const Icon = props.hasSigned ? CheckIcon : UpdateIcon
  return (
    <Tooltip title={props.hasSigned ? "Has signed the transaction" : "Awaiting their signature"}>
      <Icon style={{ opacity: props.hasSigned ? 1 : 0.5, ...props.style }} />
    </Tooltip>
  )
}

// tslint:disable-next-line no-shadowed-variable
const Signer = React.memo(function Signer(props: {
  hasSigned: boolean
  signer: Horizon.AccountSigner | { key: string; weight: number }
  style?: React.CSSProperties
  transaction: Transaction
}) {
  const isSmallScreen = useIsMobile()

  return (
    <div style={{ display: "flex", alignItems: "center", ...props.style }}>
      <SignerStatus hasSigned={props.hasSigned} style={{ fontSize: "100%", marginRight: 8 }} />
      <div style={{ whiteSpace: "nowrap" }}>
        <Address
          address={getSignerKey(props.signer)}
          style={{ display: "inline-block", fontWeight: "normal", minWidth: 480 }}
          variant={isSmallScreen ? "short" : "full"}
        />
      </div>
    </div>
  )
})

export function Signers(props: {
  accounts: Account[]
  accountData: ObservedAccountData
  transaction: Transaction
  style?: React.CSSProperties
}) {
  // TODO: We should not get the signers from the source account data, but either
  //       a) from the signature request or
  //       b) by taking the tx source and all operation source accounts into account
  const headingDetails = props.accountData.signers.every(signer => signer.weight === 1)
    ? `${props.accountData.thresholds.high_threshold} of ${props.accountData.signers.length} multi-signature`
    : `Custom consensus multi-signature`

  return (
    <SummaryItem>
      {props.accountData.signers.map((signer, index) => (
        <SummaryDetailsField
          key={getSignerKey(signer)}
          label={index === 0 ? `Signers (${headingDetails})` : undefined}
          value={
            <Signer
              hasSigned={props.transaction.signatures.some(signature =>
                signatureMatchesPublicKey(signature, getSignerKey(signer))
              )}
              signer={signer}
              transaction={props.transaction}
            />
          }
        />
      ))}
    </SummaryItem>
  )
}

export function TransactionMemo(props: { memo: Memo; style?: React.CSSProperties }) {
  if (props.memo.type === "none" || !props.memo.value) return null

  const memo = typeof props.memo.value === "string" ? props.memo.value : props.memo.value.toString("hex")
  const typeLabel = props.memo.type.substr(0, 1).toUpperCase() + props.memo.type.substr(1)

  return (
    <SummaryItem>
      <SummaryDetailsField fullWidth label={`${typeLabel} Memo`} value={memo} />
    </SummaryItem>
  )
}
