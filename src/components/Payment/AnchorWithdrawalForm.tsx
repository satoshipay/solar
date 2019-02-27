import React from "react"
import { Asset } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { VerticalLayout } from "../Layout/Box"
import { useAssetTransferServerInfos } from "./hooks"

interface Props {
  assets: Asset[]
  testnet: boolean
}

function AnchorWithdrawalForm(props: Props) {
  const transferInfos = useAssetTransferServerInfos(props.assets, props.testnet)
  const withdrawableAssetCodes = Object.keys(transferInfos.data).filter(assetCode => {
    const deposit = transferInfos.data[assetCode].deposit
    return deposit && deposit.enabled
  })

  const [assetCode, setAssetCode] = React.useState<string | null>(withdrawableAssetCodes[0] || null)

  return (
    <VerticalLayout>
      <TextField
        label="Asset"
        onChange={event => setAssetCode(event.target.value || null)}
        select
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
    </VerticalLayout>
  )
}

export default AnchorWithdrawalForm
