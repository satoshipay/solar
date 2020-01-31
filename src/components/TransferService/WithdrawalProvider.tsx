import React from "react"
import { Account } from "../../context/accounts"
import { WithdrawalState } from "./statemachine"
import { WithdrawalActions } from "./useWithdrawalState"

export interface WithdrawalContextType {
  account: Account
  actions: WithdrawalActions
  state: WithdrawalState
}

export const WithdrawalContext = React.createContext<WithdrawalContextType>({} as any)

interface WithdrawalProviderProps extends WithdrawalContextType {
  children: React.ReactNode
}

function WithdrawalProvider(props: WithdrawalProviderProps) {
  const { children, ...contextValue } = props

  return <WithdrawalContext.Provider value={contextValue}>{children}</WithdrawalContext.Provider>
}

export default WithdrawalProvider
