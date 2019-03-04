import React from "react"
import { Asset } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { TransferServer } from "@satoshipay/sep-6"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { formatFieldDescription, formatIdentifier } from "./formatters"
import { useAssetTransferServerInfos, AssetTransferInfos } from "./hooks"
import FormBuilder from "./FormBuilder"

function filterObject<V>(obj: { [key: string]: V }, filter: (value: V, key: string) => boolean) {
  return Object.keys(obj).reduce<{ [key: string]: V }>((filtered, key) => {
    const value = obj[key]
    return filter(value, key) ? { ...filtered, [key]: value } : filtered
  }, {})
}

interface FormValues {
  [fieldName: string]: string
}

interface Props {
  Actions: React.ComponentType<{ disabled?: boolean; onSubmit: () => void }>
  assets: Asset[]
  onSubmit: (transferServer: TransferServer, asset: Asset, method: string, formValues: FormValues) => void
  testnet: boolean
}

function AnchorWithdrawalInitForm(props: Props) {
  const { Actions } = props

  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)
  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(assetCode => {
    const deposit = transferInfos.data[assetCode].deposit
    return deposit && deposit.enabled
  })

  const [assetCode, setAssetCode] = React.useState<string | null>(withdrawableAssetCodes[0] || null)
  const [methodID, setMethodID] = React.useState<string | null>(null)

  const [formValues, setFormValues] = React.useState<FormValues>({})
  const setFormValue = (fieldName: string, newValue: string) =>
    setFormValues(prevFormValues => ({ ...prevFormValues, [fieldName]: newValue }))

  const withdrawalMetadata: AssetTransferInfos["data"][""] | undefined = transferInfos.data[assetCode || ""]
  const methodNames =
    withdrawalMetadata && withdrawalMetadata.withdraw && withdrawalMetadata.withdraw.types
      ? Object.keys(withdrawalMetadata.withdraw.types)
      : []
  const methodMetadata =
    methodID && withdrawalMetadata && withdrawalMetadata.withdraw && withdrawalMetadata.withdraw.types
      ? withdrawalMetadata.withdraw.types[methodID]
      : null

  const fields = methodMetadata && methodMetadata.fields ? methodMetadata.fields : {}
  const getFieldDescription = (name: string, keepShort: boolean = false) => {
    const description = (fields[name] && fields[name].description) || undefined
    return description ? formatFieldDescription(description, fields[name].optional || false, keepShort) : undefined
  }

  const handleSubmit = () => {
    const asset = props.assets.find(someAsset => someAsset.getCode() === assetCode)
    if (!asset) {
      throw new Error("No asset selected.")
    }
    const transferServer = transferInfos.transferServers.get(asset)
    if (!transferServer) {
      throw new Error(`No transfer server found for asset ${asset.getCode()}`)
    }
    if (!methodID) {
      throw new Error("No withdrawal method selected.")
    }
    props.onSubmit(transferServer, asset, methodID, formValues)
  }

  const hasEmptyMandatoryFields = Object.keys(fields).some(key => !fields[key].optional && !formValues[key])
  const isDisabled = !assetCode || !methodID || hasEmptyMandatoryFields

  return (
    <form onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout>
          <TextField
            InputLabelProps={{ shrink: true }}
            label="Asset to Withdraw"
            onChange={event => setAssetCode(event.target.value || null)}
            select
            style={{ flexGrow: 1, marginRight: 24, maxWidth: 180 }}
            value={assetCode || ""}
          >
            {Object.keys(transferInfos.data).map(assetCode => {
              const deposit = transferInfos.data[assetCode].deposit
              return deposit && deposit.enabled ? (
                <MenuItem key={assetCode} value={assetCode}>
                  {assetCode}
                </MenuItem>
              ) : null
            })}
            {withdrawableAssetCodes.length === 0 ? (
              <MenuItem disabled value="">
                No withdrawable assets
              </MenuItem>
            ) : null}
          </TextField>
          <TextField
            InputLabelProps={{ shrink: true }}
            label="Type of Withdrawal"
            onChange={event => setMethodID(event.target.value || null)}
            select
            style={{ flexGrow: 1 }}
            value={methodID || ""}
          >
            <MenuItem disabled value="">
              Please select one
            </MenuItem>
            {methodNames.map(methodName => (
              <MenuItem key={methodName} value={methodName}>
                {formatIdentifier(methodName)}
              </MenuItem>
            ))}
          </TextField>
        </HorizontalLayout>
        <HorizontalLayout margin="24px 0 0">
          <TextField
            InputLabelProps={{ shrink: true }}
            label="Destination Account"
            onChange={event => setFormValue("dest", event.target.value)}
            placeholder={getFieldDescription("dest")}
            style={{ flexGrow: 3, marginRight: fields["dest_extra"] ? 24 : undefined }}
            value={formValues.dest}
          />
          {fields["dest_extra"] ? (
            <TextField
              InputLabelProps={{ shrink: true }}
              label={getFieldDescription("dest_extra", true) || "Destination Extra Data (no description)"}
              onChange={event => setFormValue("dest_extra", event.target.value)}
              placeholder={getFieldDescription("dest_extra")}
              style={{ flexGrow: 1 }}
              value={formValues.dest_extra}
            />
          ) : null}
        </HorizontalLayout>
        <FormBuilder
          fields={filterObject(fields, (value, key) => ["dest", "dest_extra"].indexOf(key) === -1)}
          formValues={formValues}
          onSetFormValue={setFormValue}
        />
        <Actions disabled={isDisabled} onSubmit={() => undefined /* Form submission done via form.onSubmit() */} />
      </VerticalLayout>
    </form>
  )
}

export default AnchorWithdrawalInitForm
