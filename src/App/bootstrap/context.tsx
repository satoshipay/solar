import React from "react"
import { AccountsProvider } from "../context/accounts"
import { CachingProviders } from "../context/caches"
import { NotificationsProvider } from "../context/notifications"
import { SettingsProvider } from "../context/settings"
import { SignatureDelegationProvider } from "../context/signatureDelegation"
import { StellarProvider } from "../context/stellar"

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
