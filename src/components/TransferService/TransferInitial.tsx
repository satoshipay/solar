import nanoid from "nanoid"
import React from "react"
import { Asset } from "stellar-sdk"
import Collapse from "@material-ui/core/Collapse"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { makeStyles } from "@material-ui/core/styles"
import { AssetTransferInfo } from "@satoshipay/stellar-transfer"
import { trackError } from "../../context/notifications"
import { useIsSmallMobile, RefStateObject } from "../../hooks/userinterface"
import { useLoadingState } from "../../hooks/util"
import { ActionButton, DialogActionsBox } from "../Dialog/Generic"
import AssetSelector from "../Form/AssetSelector"
import Portal from "../Portal"
import { formatIdentifier } from "./formatters"
import { TransferStates } from "./statemachine"
import { DepositActions } from "./useDepositState"
import { DepositContext } from "./DepositProvider"
import FormLayout from "./FormLayout"
import { Paragraph, Summary } from "./Sidebar"
import { WithdrawalContext } from "./WithdrawalProvider"

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

interface TransferInitialProps {
  assetTransferInfos: AssetTransferInfo[]
  dialogActionsRef: RefStateObject | undefined
  state: TransferStates.SelectType
  trustedAssets: Asset[]
  type: "deposit" | "withdrawal"
  transferableAssets: Asset[]
}

function TransferInitial(props: TransferInitialProps) {
  const { account, actions } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    props.type === "deposit" ? React.useContext(DepositContext) : React.useContext(WithdrawalContext)

  const formID = React.useMemo(() => nanoid(), [])
  const classes = useFormStyles()
  const isTinyScreen = useIsSmallMobile()
  const [submissionState, handleSubmission] = useLoadingState({ throwOnError: true })

  const getAssetInfo = (asset: Asset | null): AssetTransferInfo | undefined => {
    return asset ? props.assetTransferInfos.find(assetInfo => assetInfo.asset.equals(asset)) : undefined
  }
  const getMethodNames = (asset: Asset | null): string[] => {
    const meta = getAssetInfo(asset)
    return meta && meta.withdraw && meta.withdraw.types ? Object.keys(meta.withdraw.types) : []
  }

  const initialAsset =
    props.state.asset || (props.type === "deposit" ? Asset.native() : props.transferableAssets[0]) || null
  const initialMethod =
    props.state.method || (getMethodNames(initialAsset).length === 1 ? getMethodNames(initialAsset)[0] : null)

  const [formValues, setFormValues] = React.useState<FormValues>({
    asset: initialAsset,
    methodID: initialMethod
  })

  const setFormValue = (fieldName: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormValues(prevValues => ({
      ...prevValues,
      [fieldName]: event.target.value
    }))
  }

  const methodNames = formValues.asset ? getMethodNames(formValues.asset) : []
  const showMethods = props.type === "withdrawal" && methodNames.length > 0
  const isDisabled = !formValues.asset || (!formValues.methodID && showMethods)

  const nontransferableAssets = props.trustedAssets.filter(
    asset => !props.transferableAssets.some(transferable => transferable.equals(asset))
  )

  const assetTransferInfo = getAssetInfo(formValues.asset)

  const handleAssetSelection = React.useCallback(
    (asset: Asset) => {
      const assetInfo = props.assetTransferInfos.find(info => info.asset.equals(asset))
      const transfer = assetInfo && (props.type === "deposit" ? assetInfo.deposit : assetInfo.withdraw)

      if (transfer && "types" in transfer && transfer.types && Object.keys(transfer.types).length === 1) {
        setFormValues({
          asset,
          methodID: Object.keys(transfer.types)[0]
        })
      } else {
        setFormValues(prevValues => ({
          ...prevValues,
          asset
        }))
      }
    },
    [props.assetTransferInfos, props.type]
  )

  const handleSubmit = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault()

      if (props.type === "deposit" && formValues.asset && formValues.asset.isNative()) {
        return (actions as DepositActions).selectXLMDeposit()
      }

      if (!formValues.asset) {
        return trackError(Error("Invariant violation: Form submission without selected asset"))
      }
      if (!assetTransferInfo) {
        return trackError(Error("Invariant violation: Form submission without asset transfer information"))
      }

      handleSubmission(
        actions.submitTransferSelection(assetTransferInfo.transferServer, formValues.asset, formValues.methodID)
      )
    },
    [actions, assetTransferInfo, formValues.asset, formValues.methodID, handleSubmission, props.type]
  )

  return (
    <form id={formID} noValidate onSubmit={handleSubmit}>
      <FormLayout>
        <AssetSelector
          assets={props.trustedAssets}
          disabledAssets={nontransferableAssets}
          label={isTinyScreen ? "Asset" : props.type === "deposit" ? "Asset to deposit" : "Asset to withdraw"}
          margin="normal"
          onChange={handleAssetSelection}
          showXLM={props.type === "deposit"}
          testnet={account.testnet}
          value={formValues.asset || undefined}
        >
          {props.transferableAssets.length === 0 ? (
            <MenuItem disabled value="">
              No withdrawable assets
            </MenuItem>
          ) : null}
        </AssetSelector>
        <Collapse in={showMethods}>
          <TextField
            fullWidth
            label={props.type === "deposit" ? "Type of deposit" : "Type of withdrawal"}
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
        </Collapse>
      </FormLayout>
      <Portal desktop="inline" target={props.dialogActionsRef && props.dialogActionsRef.element}>
        <DialogActionsBox>
          <ActionButton
            disabled={isDisabled}
            form={formID}
            loading={submissionState.type === "pending"}
            onClick={() => undefined}
            type="submit"
          >
            Proceed
          </ActionButton>
        </DialogActionsBox>
      </Portal>
    </form>
  )
}

const Sidebar = (props: { type: "deposit" | "withdrawal" }) =>
  props.type === "deposit" ? (
    <Summary headline="What to deposit">
      <Paragraph>
        Deposit assets to fund your account. Send USD from your bank account or ETH from your Ethereum wallet.
      </Paragraph>
      <Paragraph>Solar acts as a client to the service offered by the asset issuer only.</Paragraph>
    </Summary>
  ) : (
    <Summary headline="What to withdraw">
      <Paragraph>
        Withdraw assets in your account, like USD to your bank account or ETH to your Ethereum wallet.
      </Paragraph>
      <Paragraph>Solar acts as a client to the service offered by the asset issuer only.</Paragraph>
    </Summary>
  )

const InitialView = Object.assign(React.memo(TransferInitial), { Sidebar })

export default InitialView
