import DialogContent from "@material-ui/core/DialogContent"
import ImportIcon from "@material-ui/icons/ArrowDownward"
import ExportIcon from "@material-ui/icons/ArrowUpward"
import React from "react"
import { useTranslation } from "react-i18next"
import ExportAccountsDialog from "~AccountSync/components/ExportAccounts"
import ImportAccountsDialog from "~AccountSync/components/ImportAccounts"
import MainSelectionButton from "~Generic/components/MainSelectionButton"
import { VerticalLayout } from "~Layout/components/Box"
import Carousel from "~Layout/components/Carousel"
import DialogBody from "~Layout/components/DialogBody"

interface Props {}

function SyncAccountsDialog(props: Props) {
  const { t } = useTranslation()

  const [shownView, setShownView] = React.useState<"import" | "export" | null>(null)

  const onClose = () => setShownView(null)

  return (
    <DialogBody>
      <DialogContent style={{ flexGrow: 0, padding: 0 }}>
        <Carousel current={shownView === null ? 0 : 1}>
          <VerticalLayout alignItems="center" margin="48px 0 24px" padding="0 8px">
            <VerticalLayout alignItems="stretch" margin="0 auto">
              <MainSelectionButton
                dense
                label="Export Accounts"
                description="Export Accounts from Solar to another device"
                gutterBottom
                onClick={() => setShownView("export")}
                Icon={ExportIcon}
                variant="primary"
              />
              <MainSelectionButton
                dense
                label="Import Accounts"
                description="Import Accounts from another device using Solar"
                gutterBottom
                onClick={() => setShownView("import")}
                Icon={ImportIcon}
              />
            </VerticalLayout>
          </VerticalLayout>
          <>
            {shownView === "import" ? (
              <ImportAccountsDialog onClose={onClose} />
            ) : (
              <ExportAccountsDialog onClose={onClose} />
            )}
          </>
        </Carousel>
      </DialogContent>
    </DialogBody>
  )
}

export default React.memo(SyncAccountsDialog)
