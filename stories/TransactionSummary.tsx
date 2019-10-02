import React from "react"
import Async from "react-promise"
import { Asset, Memo, Operation, Server, TransactionBuilder, Networks } from "stellar-sdk"
import { storiesOf } from "@storybook/react"
import TransactionSummary from "../src/components/TransactionReview/TransactionSummary"
import { useWebAuth } from "../src/hooks/stellar"

interface SampleWebAuthProps {
  accountID: string
  children: (promise: Promise<any>) => React.ReactNode
  issuerID: string
}

function SampleWebAuth(props: SampleWebAuthProps) {
  const horizon = new Server("https://horizon.stellar.org")
  const WebAuth = useWebAuth()

  const promise = React.useMemo(
    () =>
      (async () => {
        const account = await horizon.loadAccount(props.accountID)
        const webauthMetadata = await WebAuth.fetchWebAuthData(horizon, props.issuerID)

        const transaction = await WebAuth.fetchChallenge(
          webauthMetadata!.endpointURL,
          webauthMetadata!.signingKey,
          account.id
        )
        return transaction
      })(),
    []
  )

  return <>{props.children(promise)}</>
}

storiesOf("TransactionSummary", module)
  .add("Payment", () => {
    const horizon = new Server("https://horizon-testnet.stellar.org")

    const promise = (async () => {
      const account = await horizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      const builder = new TransactionBuilder(account, { fee: 100 })
      builder.addOperation(
        Operation.payment({
          amount: "1.5",
          asset: Asset.native(),
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
        })
      )
      builder.setNetworkPassphrase(Networks.TESTNET)
      builder.setTimeout(60)
      return builder.build()
    })()

    return (
      <Async
        promise={promise}
        then={transaction => <TransactionSummary account={null} testnet transaction={transaction} />}
        catch={error => <>{error.message}</>}
      />
    )
  })
  .add("Payment with memo", () => {
    const horizon = new Server("https://horizon-testnet.stellar.org")

    const promise = (async () => {
      const account = await horizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      const builder = new TransactionBuilder(account, {
        fee: 100,
        memo: Memo.text("Demo transaction")
      })
      builder.addOperation(
        Operation.payment({
          amount: "20",
          asset: Asset.native(),
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
        })
      )
      builder.setNetworkPassphrase(Networks.TESTNET)
      builder.setTimeout(60)
      return builder.build()
    })()

    return (
      <Async
        promise={promise}
        then={transaction => <TransactionSummary account={null} testnet transaction={transaction} />}
        catch={error => <>{error.message}</>}
      />
    )
  })
  .add("Account creation & Inflation destination", () => {
    const horizon = new Server("https://horizon-testnet.stellar.org")

    const promise = (async () => {
      const account = await horizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      const builder = new TransactionBuilder(account, { fee: 100 })
      builder.addOperation(
        Operation.createAccount({
          startingBalance: "1.0",
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
        })
      )
      builder.addOperation(
        Operation.setOptions({
          inflationDest: "GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT"
        })
      )
      builder.setNetworkPassphrase(Networks.TESTNET)
      builder.setTimeout(60)
      return builder.build()
    })()

    return (
      <Async
        promise={promise}
        then={transaction => <TransactionSummary account={null} testnet transaction={transaction} />}
        catch={error => <>{error.message}</>}
      />
    )
  })
  .add("Stellar web auth", () => {
    return (
      <SampleWebAuth
        accountID="GDOOMATUOJPLIQMQ4WWXBEWR5UMKJW65CFKJJW3LV7XZYIEQHZPDQCBI"
        issuerID="GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5"
      >
        {promise => (
          <Async
            promise={promise}
            then={transaction => <TransactionSummary account={null} testnet transaction={transaction} />}
            catch={error => <>{error.message}</>}
          />
        )}
      </SampleWebAuth>
    )
  })
  .add("Account Merge", () => {
    const horizon = new Server("https://horizon-testnet.stellar.org")

    const promise = (async () => {
      const account = await horizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      const builder = new TransactionBuilder(account, { fee: 100 })
      builder.addOperation(
        Operation.accountMerge({
          source: "GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT",
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
        })
      )
      builder.setNetworkPassphrase(Networks.TESTNET)
      builder.setTimeout(60)
      return builder.build()
    })()

    return (
      <Async
        promise={promise}
        then={transaction => <TransactionSummary account={null} testnet transaction={transaction} />}
        catch={error => <>{error.message}</>}
      />
    )
  })
