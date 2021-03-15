import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import ListItemText from "@material-ui/core/ListItemText"
import Radio from "@material-ui/core/Radio"
import RadioGroup from "@material-ui/core/RadioGroup"
import React from "react"
import { useTranslation } from "react-i18next"
import { Horizon } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { Address } from "~Generic/components/PublicKey"

interface SignerSelectorProps {
  accounts: Account[]
  onSelect: (signer: Horizon.AccountSigner) => void
  selected: Horizon.AccountSigner | undefined
  signers: Horizon.AccountSigner[]
  testnet: boolean
}

function SignerSelector(props: SignerSelectorProps) {
  const { t } = useTranslation()
  return (
    <RadioGroup value={props.selected?.key || ""}>
      <List>
        {props.signers.map(signer => (
          <ListItem button key={signer.key} onClick={() => props.onSelect(signer)}>
            <ListItemIcon>
              <Radio edge="start" value={signer.key} />
            </ListItemIcon>
            <ListItemText
              primary={<Address address={signer.key} variant="full" testnet={props.testnet} />}
              secondary={
                props.accounts.some(
                  account => account.publicKey === signer.key && account.testnet === props.testnet
                ) ? (
                  <span>{t("account-settings.manage-signers.signers-editor.list.item.local-key")}</span>
                ) : null
              }
            />
          </ListItem>
        ))}
      </List>
    </RadioGroup>
  )
}

export default React.memo(SignerSelector)
