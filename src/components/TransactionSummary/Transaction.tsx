import BigNumber from "big.js"
import React from "react"
import { Memo, Transaction, Horizon } from "stellar-sdk"
import MuiListItem from "@material-ui/core/ListItem"
import MuiListItemIcon from "@material-ui/core/ListItemIcon"
import MuiListItemText from "@material-ui/core/ListItemText"
import Tooltip from "@material-ui/core/Tooltip"
import Typography from "@material-ui/core/Typography"
import CheckIcon from "@material-ui/icons/Check"
import UpdateIcon from "@material-ui/icons/Update"
import WarningIcon from "@material-ui/icons/Warning"
import { Account } from "../../context/accounts"
import { getSignerKey, signatureMatchesPublicKey } from "../../lib/stellar"
import { ObservedAccountData } from "../../subscriptions"
import { warningColor } from "../../theme"
import { SingleBalance } from "../Account/AccountBalances"
import { HorizontalLayout } from "../Layout/Box"
import { ListItem } from "../List"
import { Address } from "../PublicKey"

function MetaDetails(props: { children: React.ReactNode }) {
  return <div style={{ fontSize: "80%", marginTop: 8, marginLeft: 16 }}>{props.children}</div>
}

export function DangerousTransactionWarning(props: { style?: React.CSSProperties }) {
  return (
    <MuiListItem style={{ background: warningColor, ...props.style }}>
      <MuiListItemIcon>
        <WarningIcon />
      </MuiListItemIcon>
      <MuiListItemText
        primary="Transaction initiated by unrecognized account"
        secondary="Please review carefully. In case of doubt, prefer dismissing."
      />
    </MuiListItem>
  )
}

export function TransactionMemo(props: { memo: Memo; style?: React.CSSProperties }) {
  if (props.memo.type === "none" || !props.memo.value) return null

  const memo = typeof props.memo.value === "string" ? props.memo.value : props.memo.value.toString("hex")
  const typeLabel = props.memo.type.substr(0, 1).toUpperCase() + props.memo.type.substr(1)

  return <ListItem heading={`${typeLabel} Memo`} primaryText={<MetaDetails>{memo}</MetaDetails>} style={props.style} />
}

export function SignerStatus(props: { hasSigned: boolean; style?: React.CSSProperties }) {
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
  transaction: Transaction
}) {
  return (
    <HorizontalLayout alignItems="center">
      <>
        <SignerStatus hasSigned={props.hasSigned} style={{ marginRight: 8 }} />
        <div style={{ whiteSpace: "nowrap" }}>
          <Address
            address={getSignerKey(props.signer)}
            style={{ display: "inline-block", fontWeight: "normal", minWidth: 480 }}
            variant="full"
          />
        </div>
      </>
    </HorizontalLayout>
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
    <ListItem
      heading={`Signers (${headingDetails})`}
      primaryText={
        <MetaDetails>
          <>
            {props.accountData.signers.map(signer => (
              <Signer
                key={getSignerKey(signer)}
                hasSigned={props.transaction.signatures.some(signature =>
                  signatureMatchesPublicKey(signature, getSignerKey(signer))
                )}
                signer={signer}
                transaction={props.transaction}
              />
            ))}
          </>
        </MetaDetails>
      }
      style={props.style}
    />
  )
}

export function SourceAccount(props: { transaction: Transaction; style?: React.CSSProperties }) {
  return (
    <ListItem
      heading="Source Account"
      primaryText={
        <MetaDetails>
          <Address address={props.transaction.source} style={{ fontWeight: "normal" }} variant="full" />
        </MetaDetails>
      }
      style={props.style}
    />
  )
}

export function TransactionMetadata(props: { style?: React.CSSProperties; transaction: Transaction }) {
  const fee = BigNumber(props.transaction.fee)
    .mul(props.transaction.operations.length)
    .div(1e7)
  return (
    <ListItem
      primaryText={
        <Typography component="div" variant="body1">
          <HorizontalLayout justifyContent="space-between">
            <span style={{ marginLeft: "auto", fontSize: "80%" }}>
              Fee: <SingleBalance assetCode="XLM" balance={fee.toString()} inline />
            </span>
          </HorizontalLayout>
        </Typography>
      }
      style={props.style}
    />
  )
}
