import nanoid from "nanoid"
import React from "react"
import { Asset } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { makeStyles } from "@material-ui/core/styles"
import { AssetTransferInfo, EmptyAssetTransferInfo } from "@satoshipay/stellar-sep-6"
import { trackError } from "../../context/notifications"
import { useIsSmallMobile, RefStateObject } from "../../hooks/userinterface"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AssetSelector from "../Form/AssetSelector"
import Portal from "../Portal"
import { formatIdentifier } from "./formatters"
import { AssetTransferInfos } from "./transferservice"
import FormLayout from "./FormLayout"

const useFormStyles = makeStyles({
  select: {
    fontSize: 18,
    fontWeight: 400
  }
})

interface FormValues {
  asset: Asset | null
  methodID: string | null
}

interface SubmitValues {
  asset: Asset
  methodID: string
  withdrawalMetadata: AssetTransferInfo | EmptyAssetTransferInfo
}

interface WithdrawalRequestFormStartProps {
  actionsRef: RefStateObject | undefined
  assets: Asset[]
  initialAsset?: Asset
  initialMethod?: string
  onSubmit: (values: SubmitValues) => void
  transferInfos: AssetTransferInfos
  withdrawableAssets: Asset[]
}

function WithdrawalRequestFormStart(props: WithdrawalRequestFormStartProps) {
  const formID = React.useMemo(() => nanoid(), [])
  const classes = useFormStyles()
  const isTinyScreen = useIsSmallMobile()

  const getWithdrawalMetadata = (asset: Asset | null): AssetTransferInfo | EmptyAssetTransferInfo | undefined => {
    return asset && props.transferInfos.data.has(asset) ? props.transferInfos.data.get(asset)!.transferInfo : undefined
  }
  const getMethodNames = (asset: Asset | null): string[] => {
    const meta = getWithdrawalMetadata(asset)
    return meta && meta.withdraw && meta.withdraw.types ? Object.keys(meta.withdraw.types) : []
  }

  const initialAsset = props.initialAsset || props.withdrawableAssets[0] || null
  const methodNames = getMethodNames(initialAsset)

  const [formValues, setFormValues] = React.useState<FormValues>({
    asset: initialAsset,
    methodID: props.initialMethod || methodNames.length === 1 ? methodNames[0] : null
  })

  const setFormValue = (fieldName: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [fieldName]: event.target.value
    }))
  }

  const isDisabled = !formValues.asset || !formValues.methodID

  const nonwithdrawableAssets = props.assets.filter(
    asset => !props.withdrawableAssets.some(withdrawable => withdrawable.equals(asset))
  )

  const withdrawalMetadata = getWithdrawalMetadata(formValues.asset)

  const handleAssetSelection = React.useCallback(
    (asset: Asset) => {
      const withdraw = props.transferInfos.data.has(asset) && props.transferInfos.data.get(asset)!.transferInfo.withdraw

      if (withdraw && withdraw.types && Object.keys(withdraw.types).length === 1) {
        setFormValues({
          asset,
          methodID: Object.keys(withdraw.types)[0]
        })
      } else {
        setFormValues(prevValues => ({
          ...prevValues,
          asset
        }))
      }
    },
    [props.transferInfos]
  )

  const handleSubmit = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()

      if (!formValues.asset) {
        return trackError(Error("Invariant violation: Form submission without selected asset"))
      }
      if (!formValues.methodID) {
        return trackError(Error("Invariant violation: Form submission without selected method"))
      }
      if (!withdrawalMetadata) {
        return trackError(Error("Invariant violation: Form submission without withdrawal metadata"))
      }

      props.onSubmit({
        asset: formValues.asset,
        methodID: formValues.methodID,
        withdrawalMetadata
      })
    },
    [formValues, withdrawalMetadata]
  )

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <FormLayout>
        <AssetSelector
          assets={props.assets}
          disabledAssets={nonwithdrawableAssets}
          label={isTinyScreen ? "Asset" : "Asset to withdraw"}
          margin="normal"
          onChange={handleAssetSelection}
          selected={formValues.asset || undefined}
        >
          {props.withdrawableAssets.length === 0 ? (
            <MenuItem disabled value="">
              No withdrawable assets
            </MenuItem>
          ) : null}
        </AssetSelector>
        <TextField
          fullWidth
          label="Type of withdrawal"
          margin="normal"
          onChange={setFormValue("methodID")}
          select
          SelectProps={{
            classes: {
              select: classes.select
            }
          }}
          value={formValues.methodID || ""}
        >
          <MenuItem disabled value="">
            {formValues.asset ? "Please select a type" : "Select an asset first"}
          </MenuItem>
          {methodNames.map(methodName => (
            <MenuItem key={methodName} value={methodName}>
              {formatIdentifier(methodName)}
            </MenuItem>
          ))}
        </TextField>
      </FormLayout>
      <Portal target={props.actionsRef && props.actionsRef.element}>
        <DialogActionsBox desktopStyle={{ marginTop: 0 }}>
          <ActionButton disabled={isDisabled} form={formID} onClick={() => undefined} type="submit">
            Proceed
          </ActionButton>
        </DialogActionsBox>
      </Portal>
    </form>
  )
}

export default React.memo(WithdrawalRequestFormStart)

export { SubmitValues as StartFormValues }
