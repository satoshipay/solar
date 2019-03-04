import BigNumber from "big.js"
import React from "react"
import { Asset } from "stellar-sdk"
import MenuItem from "@material-ui/core/MenuItem"
import TextField from "@material-ui/core/TextField"
import { TransferServer } from "@satoshipay/sep-6"
import { HorizontalLayout, VerticalLayout } from "../Layout/Box"
import { formatFieldDescription, formatIdentifier } from "./formatters"

interface ExtraValues {
  [fieldName: string]: string
}

interface Props {
  Actions: React.ComponentType<{ disabled?: boolean; onSubmit: () => void }>
  assets: Asset[]
  onSubmit: (transferServer: TransferServer, asset: Asset, amount: BigNumber, extraFields: ExtraValues) => void
  testnet: boolean
}

function AnchorWithdrawalFinishForm(props: Props) {
  const { Actions } = props

  const [amount, setAmount] = React.useState("")
  const [extraFields, setExtraFields] = React.useState<ExtraValues>({})

  const handleSubmit = () => {
    // FIXME
  }

  const hasEmptyMandatoryFields = Object.keys(fields).some(key => !fields[key].optional && !formValues[key])
  const isDisabled = !assetCode || !methodID || hasEmptyMandatoryFields

  return (
    <form onSubmit={handleSubmit}>
      <VerticalLayout>
        <HorizontalLayout>
          {/* https://satoshipay.slack.com/files/U9S4JUAAF/FGKL0L75L/10_withdraw_2.png */}
        </HorizontalLayout>
        <HorizontalLayout margin="24px 0 0" />
        <Actions disabled={isDisabled} onSubmit={() => undefined /* Form submission done via form.onSubmit() */} />
      </VerticalLayout>
    </form>
  )
}

export default AnchorWithdrawalFinishForm
