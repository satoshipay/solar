import React from "react"
import Typography from "@material-ui/core/Typography"
import { SettingsConsumer } from "../context/settings"
import ToggleSection from "./Layout/ToggleSection"

const Settings = () => {
  return (
    <SettingsConsumer>
      {settings => (
        <>
          <ToggleSection checked={settings.showTestnet} onChange={settings.toggleTestnet} title="Show Testnet Accounts">
            <Typography
              color={settings.showTestnet ? "default" : "textSecondary"}
              style={{ margin: "12px 0 0" }}
              variant="body1"
            >
              The test network is a copy of the main Stellar network were the traded tokens have no real-world value.
              You can request free testnet XLM from the so-called friendbot to activate a testnet account and get
              started without owning any actual funds.
            </Typography>
            <Typography
              color={settings.showTestnet ? "default" : "textSecondary"}
              style={{ margin: "12px 0 0" }}
              variant="body1"
            >
              Note: Testnet accounts will always be shown if you have got testnet accounts already.
            </Typography>
          </ToggleSection>
          <ToggleSection
            checked={settings.multiSignature}
            onChange={settings.toggleMultiSignature}
            title="Enable Multi-Signature Features"
          >
            <Typography
              color={settings.multiSignature ? "default" : "textSecondary"}
              style={{ margin: "12px 0 0" }}
              variant="body1"
            >
              <b>Experimental feature:</b> Add co-signers to an account, define that all signers of an account have to
              sign transactions unanimously or a certain subset of signers have to sign a transaction in order to be
              valid.
            </Typography>
          </ToggleSection>
        </>
      )}
    </SettingsConsumer>
  )
}

export default Settings
