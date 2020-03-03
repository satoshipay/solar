import React from "react"
import { useTranslation } from "react-i18next"
import DialogContent from "@material-ui/core/DialogContent"
import DialogContentText from "@material-ui/core/DialogContentText"
import DialogBody from "../Dialog/DialogBody"
import TrustedServiceSelectionList from "./TrustedServiceSelectionList"

function ManageTrustedServicesDialog() {
  const { t } = useTranslation()

  return (
    <DialogBody>
      <DialogContent style={{ flexGrow: 0, padding: 0 }}>
        <DialogContentText align="justify" style={{ marginTop: 8 }}>
          {t("app-settings.trusted-services.info")}
        </DialogContentText>

        <TrustedServiceSelectionList />
      </DialogContent>
    </DialogBody>
  )
}

export default React.memo(ManageTrustedServicesDialog)
