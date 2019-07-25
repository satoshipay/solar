import React from "react"
import { Keypair } from "stellar-sdk"
import { Dialog } from "@material-ui/core"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Radio from "@material-ui/core/Radio"
import Typography from "@material-ui/core/Typography"
import withStyles, { ClassNameMap, StyleRules } from "@material-ui/core/styles/withStyles"
import { useIsMobile } from "../../hooks"
import { Account, AccountsContext } from "../../context/accounts"
import { trackError } from "../../context/notifications"
import AccountCreationForm, { AccountCreationValues } from "../Form/CreateAccount"
import { Box } from "../Layout/Box"
import AccountBalances from "./AccountBalances"

const isMobileDevice = process.env.PLATFORM === "android" || process.env.PLATFORM === "ios"

const accountListItemStyles: StyleRules = {
  listItem: {
    background: "#FFFFFF",
    height: 64,
    "&:focus": {
      backgroundColor: "#FFFFFF"
    },
    "&:hover": {
      backgroundColor: isMobileDevice ? "#FFFFFF" : "rgb(232, 232, 232)"
    }
  },
  newAccountItem: {
    background: "#FAFAFA",
    "&:focus": {
      backgroundColor: "#FAFAFA"
    },
    "&:hover": {
      backgroundColor: isMobileDevice ? "#FAFAFA" : "rgb(232, 232, 232)"
    }
  }
}

interface CreateAccountListItemProps {
  classes: ClassNameMap<keyof typeof accountListItemStyles>
  disabled?: boolean
  index: number
  onClick: (event: React.MouseEvent) => void
  selected: boolean
  style?: React.CSSProperties
  testnet: boolean
}

const CreateAccountListItem = React.memo(
  // tslint:disable-next-line no-shadowed-variable
  withStyles(accountListItemStyles)(function CreateAccountListItem(props: CreateAccountListItemProps) {
    return (
      <ListItem
        button
        className={`${props.classes.listItem} ${props.classes.newAccountItem}`}
        disabled={props.disabled}
        selected={props.selected}
        onClick={props.onClick}
      >
        <ListItemIcon>
          <>{null}</>
        </ListItemIcon>
        <ListItemText primary={`Create new ${props.testnet ? "testnet" : ""} account`} />
      </ListItem>
    )
  } as React.ComponentType<CreateAccountListItemProps>)
)

interface AccountSelectionListItemProps {
  account: Account
  classes: ClassNameMap<keyof typeof accountListItemStyles>
  disabled?: boolean
  index: number
  onClick: (event: React.MouseEvent, index: number) => void
  selected: boolean
  style?: React.CSSProperties
}

const AccountSelectionListItem = React.memo(
  // tslint:disable-next-line no-shadowed-variable
  withStyles(accountListItemStyles)(function AccountSelectionListItem(props: AccountSelectionListItemProps) {
    return (
      <ListItem
        button
        className={props.classes.listItem}
        disabled={props.disabled}
        selected={props.selected}
        onClick={event => props.onClick(event, props.index)}
      >
        <ListItemIcon style={{ marginRight: 0 }}>
          <Radio checked={props.selected && !props.disabled} color="default" />
        </ListItemIcon>
        <ListItemText
          primary={props.account.name}
          secondary={<AccountBalances publicKey={props.account.publicKey} testnet={props.account.testnet} />}
        />
      </ListItem>
    )
  } as React.ComponentType<AccountSelectionListItemProps>)
)

interface AccountSelectionListProps {
  accounts: Account[]
  disabled?: boolean
  testnet: boolean
  title?: React.ReactNode
  onChange?: (account: Account) => void
}

function AccountSelectionList(props: AccountSelectionListProps) {
  const { createAccount, accounts: allAccounts } = React.useContext(AccountsContext)

  const [createAccountOpened, setCreateAccountOpened] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)

  const isSmallScreen = useIsMobile()

  function handleListItemClick(event: React.MouseEvent, index: number) {
    setSelectedIndex(index)
    if (props.onChange) {
      props.onChange(props.accounts[index])
    }
  }

  const onCreateAccount = async (formValues: AccountCreationValues) => {
    try {
      await createAccount({
        name: formValues.name,
        keypair: Keypair.fromSecret(formValues.privateKey),
        password: formValues.setPassword ? formValues.password : null,
        testnet: props.testnet
      })
      setCreateAccountOpened(false)
    } catch (error) {
      trackError(error)
    }
  }

  return (
    <>
      {props.title ? (
        <Typography color="textSecondary" style={{ padding: "0 16px", marginBottom: 8 }} variant="subtitle1">
          {props.title}
        </Typography>
      ) : null}
      <List
        disablePadding
        style={{
          background: "transparent",
          boxShadow: "0 8px 16px 0 rgba(0, 0, 0, 0.1)",
          paddingLeft: 0,
          paddingRight: 0,
          maxHeight: "50vh",
          overflowY: "auto"
        }}
      >
        <CreateAccountListItem
          index={0}
          onClick={() => setCreateAccountOpened(true)}
          disabled={props.disabled}
          selected={false}
          testnet={props.testnet}
        />

        {props.accounts.map((account, index) => (
          <AccountSelectionListItem
            account={account}
            disabled={props.disabled}
            index={index}
            key={account.id}
            onClick={handleListItemClick}
            selected={index === selectedIndex}
          />
        ))}
        {props.accounts.length === 0 ? (
          <Typography style={{ opacity: 0.7, textAlign: "center" }}>(No accounts)</Typography>
        ) : null}
      </List>

      <Dialog
        open={createAccountOpened}
        fullScreen
        PaperProps={{
          // let the <Section> set the padding, so it will color the iPhone X top notch
          style: { padding: 0 }
        }}
      >
        <Box padding={isSmallScreen ? "24px" : " 24px 32px"} overflow="auto">
          <AccountCreationForm
            accounts={allAccounts}
            onCancel={() => setCreateAccountOpened(false)}
            onSubmit={onCreateAccount}
            testnet={props.testnet}
          />
        </Box>
      </Dialog>
    </>
  )
}

export default AccountSelectionList
