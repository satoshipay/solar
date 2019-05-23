import React from "react"
import Tooltip from "@material-ui/core/Tooltip"
import GroupIcon from "@material-ui/icons/Group"
import VerifiedUserIcon from "@material-ui/icons/VerifiedUser"
import { Account } from "../../context/accounts"
import { useRouter, ObservedAccountData } from "../../hooks"
import * as routes from "../../routes"
import { primaryBackgroundColor } from "../../theme"
import { HorizontalLayout } from "../Layout/Box"
import MainTitle from "../MainTitle"

function PasswordStatus(props: { safe: boolean; style?: React.CSSProperties }) {
  return (
    <Tooltip title={props.safe ? "Password protected" : "No password"}>
      <VerifiedUserIcon style={{ opacity: props.safe ? 1 : 0.5, ...props.style }} />
    </Tooltip>
  )
}

function TestnetBadge(props: { style?: React.CSSProperties }) {
  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px",
    background: "white",
    borderRadius: 3,
    color: primaryBackgroundColor,
    fontSize: "50%",
    fontWeight: "bold",
    lineHeight: "100%",
    textTransform: "uppercase",
    ...props.style
  }
  return <span style={style}>Testnet</span>
}

// tslint:disable-next-line no-shadowed-variable
const Badges = React.memo(function Badges(props: { account: Account; accountData: ObservedAccountData }) {
  return (
    <HorizontalLayout display="inline-flex" alignItems="center" width="auto" fontSize="1.5rem">
      {props.account.testnet ? <TestnetBadge style={{ marginRight: 16 }} /> : null}
      {props.accountData.signers.length > 1 ? (
        <Tooltip title="Multi-Signature Account">
          <GroupIcon style={{ fontSize: "120%", marginRight: 8 }} />
        </Tooltip>
      ) : null}
      <PasswordStatus safe={props.account.requiresPassword} style={{ fontSize: "90%", marginTop: "-0.05em" }} />
    </HorizontalLayout>
  )
})

interface AccountTitleProps {
  account: Account
  accountData: ObservedAccountData
  actions: React.ReactNode
  editable: boolean
  editableContent: string
  onEdit: (newValue: string) => void
}

function AccountTitle(props: AccountTitleProps) {
  const router = useRouter()
  const onNavigateBack = React.useCallback(() => router.history.push(routes.allAccounts()), [])

  return (
    <MainTitle
      editable={props.editable}
      editableContent={props.editableContent}
      onEdit={props.onEdit}
      title={<span style={{ marginRight: 20 }}>{props.account.name}</span>}
      titleColor="inherit"
      onBack={onNavigateBack}
      style={{ marginTop: -12, marginLeft: 0 }}
      badges={<Badges account={props.account} accountData={props.accountData} />}
      actions={props.actions}
    />
  )
}

export default React.memo(AccountTitle)
