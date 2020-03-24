import React from "react"
import { Account } from "~App/contexts/accounts"
import { TransferState } from "../util/statemachine"
import { DepositActions } from "../hooks/useDepositState"

export interface DepositContextType {
  account: Account
  actions: DepositActions
  state: TransferState
}

export const DepositContext = React.createContext<DepositContextType>({} as any)

export interface DepositProviderProps extends DepositContextType {
  children: React.ReactNode
}

function DepositProvider(props: DepositProviderProps) {
  const { children, ...contextValue } = props

  return <DepositContext.Provider value={contextValue}>{children}</DepositContext.Provider>
}

export default DepositProvider
