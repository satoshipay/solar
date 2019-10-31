declare module "react-router" {
  import React from "react"
  import { RouteComponentProps } from "react-router/index"
  export * from "react-router/index"

  const context: React.Context<RouteComponentProps<any>>

  export { context as __RouterContext }
}
