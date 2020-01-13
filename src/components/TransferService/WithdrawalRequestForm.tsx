import React from "react"
import { Asset } from "stellar-sdk"
import { TransferServer } from "@satoshipay/stellar-sep-6"
import { RefStateObject } from "../../hooks/userinterface"
import Carousel from "../Layout/Carousel"
import { useAssetTransferServerInfos } from "./transferservice"
import WithdrawalRequestFormDetails, { DetailsFormValues } from "./WithdrawalRequestFormDetails"
import WithdrawalRequestFormStart, { StartFormValues } from "./WithdrawalRequestFormStart"

interface FormValues {
  [fieldName: string]: string
}

interface Props {
  actionsRef: RefStateObject
  assets: Asset[]
  initialAsset?: Asset
  initialFormValues?: FormValues
  initialMethod?: string
  onSubmit: (transferServer: TransferServer, asset: Asset, method: string, formValues: FormValues) => void
  pendingAnchorCommunication?: boolean
  testnet: boolean
  withdrawableAssets: Asset[]
}

function WithdrawalRequestForm(props: Props) {
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)

  const withdrawableAssets = props.withdrawableAssets

  const [startFormValues, setStartFormValues] = React.useState<StartFormValues | undefined>(undefined)
  const [detailsFormValues, setDetailsFormValues] = React.useState<DetailsFormValues | undefined>(undefined)

  const fetchWithdrawalDetails = React.useCallback(
    (formValues: DetailsFormValues) => {
      setDetailsFormValues(formValues)

      if (!startFormValues) {
        throw new Error("Invariant violation: No asset / method selected.")
      }

      const transferServer = transferInfos.data.get(startFormValues.asset)!.transferServer
      if (!transferServer) {
        throw new Error(`No transfer server found for asset ${startFormValues.asset.getCode()}`)
      }

      props.onSubmit(transferServer, startFormValues.asset, startFormValues.methodID, formValues)
    },
    [props.onSubmit, startFormValues, transferInfos]
  )

  const showStartForm = !startFormValues

  return (
    <Carousel current={showStartForm ? 0 : 1}>
      <WithdrawalRequestFormStart
        actionsRef={showStartForm ? props.actionsRef : undefined}
        assets={props.assets}
        initialAsset={props.initialAsset}
        initialMethod={props.initialMethod}
        onSubmit={setStartFormValues}
        transferInfos={transferInfos}
        withdrawableAssets={withdrawableAssets}
      />
      {startFormValues ? (
        <WithdrawalRequestFormDetails
          actionsRef={showStartForm ? undefined : props.actionsRef}
          asset={startFormValues.asset}
          initialFormValues={detailsFormValues}
          methodID={startFormValues.methodID}
          onSubmit={fetchWithdrawalDetails}
          withdrawalMetadata={startFormValues.withdrawalMetadata}
        />
      ) : null}
    </Carousel>
  )
}

export default React.memo(WithdrawalRequestForm)
