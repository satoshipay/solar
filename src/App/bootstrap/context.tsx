import React from "react"
import { AccountsProvider } from "../contexts/accounts"
import { CachingProviders } from "../contexts/caches"
import { NotificationsProvider } from "../contexts/notifications"
import { SettingsProvider } from "../contexts/settings"
import { SignatureDelegationProvider } from "../contexts/signatureDelegation"
import { StellarProvider } from "../contexts/stellar"

export function ContextProviders(props: { children: React.ReactNode }) {
  return (
    <StellarProvider>
      <AccountsProvider>
        <SettingsProvider>
          <CachingProviders>
            <NotificationsProvider>
              <SignatureDelegationProvider>{props.children}</SignatureDelegationProvider>
            </NotificationsProvider>
          </CachingProviders>
        </SettingsProvider>
      </AccountsProvider>
    </StellarProvider>
  )
}
