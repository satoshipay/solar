import React from "react"
import { Account } from "~App/context/accounts"
import { TransferState } from "../util/statemachine"
import { WithdrawalActions } from "../hooks/useWithdrawalState"

export interface WithdrawalContextType {
  account: Account
  actions: WithdrawalActions
  state: TransferState
}

export const WithdrawalContext = React.createContext<WithdrawalContextType>({} as any)

export interface WithdrawalProviderProps extends WithdrawalContextType {
  children: React.ReactNode
}

function WithdrawalProvider(props: WithdrawalProviderProps) {
  const { children, ...contextValue } = props

  return <WithdrawalContext.Provider value={contextValue}>{children}</WithdrawalContext.Provider>
}

export default WithdrawalProvider
