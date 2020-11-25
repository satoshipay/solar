import React from "react"
import { AccountsProvider } from "../contexts/accounts"
import { CachingProviders } from "../contexts/caches"
import { NotificationsProvider } from "../contexts/notifications"
import { SettingsProvider } from "../contexts/settings"
import { SignatureDelegationProvider } from "../contexts/signatureDelegation"
import { StellarProvider } from "../contexts/stellar"
import { TransactionRequestProvider } from "../contexts/transactionRequest"

export function ContextProviders(props: { children: React.ReactNode }) {
  return (
    <StellarProvider>
      <AccountsProvider>
        <SettingsProvider>
          <TransactionRequestProvider>
            <CachingProviders>
              <NotificationsProvider>
                <SignatureDelegationProvider>{props.children}</SignatureDelegationProvider>
              </NotificationsProvider>
            </CachingProviders>
          </TransactionRequestProvider>
        </SettingsProvider>
      </AccountsProvider>
    </StellarProvider>
  )
}
