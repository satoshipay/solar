import React from "react"
import Async from "react-promise"
import { xdr, AccountResponse, Asset, Memo, Networks, Operation, Server, TransactionBuilder } from "stellar-sdk"
import { storiesOf } from "@storybook/react"
import { TransactionReviewDialogBody } from "../src/components/TransactionReview/TransactionReviewDialog"
import { Account } from "../src/context/accounts"
import { useWebAuth } from "../src/hooks/stellar"

const eurt = new Asset("EURT", "GAP5LETOV6YIE62YAM56STDANPRDO7ZFDBGSNHJQIYGGKSMOZAHOOS2S")
const testnetHorizon = new Server("https://horizon-testnet.stellar.org")

const doNothing = () => undefined

const accountStub: Account = {
  id: "1",
  name: "Testnet account",
  publicKey: "GDOOMATUOJPLIQMQ4WWXBEWR5UMKJW65CFKJJW3LV7XZYIEQHZPDQCBI",
  requiresPassword: false,
  testnet: true,
  getPrivateKey() {
    throw Error("Just a mock.")
  },
  signTransaction() {
    throw Error("Just a mock.")
  }
}

function buildTransaction(
  account: AccountResponse,
  operations: xdr.Operation[],
  options?: Partial<TransactionBuilder.TransactionBuilderOptions>
) {
  const builder = new TransactionBuilder(account, { fee: 100, ...options })

  for (const operation of operations) {
    builder.addOperation(operation)
  }

  builder.setNetworkPassphrase(Networks.TESTNET)
  builder.setTimeout(60)
  return builder.build()
}

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
        const webauthMetadata = await WebAuth.fetchWebAuthData(String(horizon.serverURL), props.issuerID)

        const transaction = await WebAuth.fetchChallenge(
          webauthMetadata!.endpointURL,
          webauthMetadata!.signingKey,
          account.id,
          Networks.PUBLIC
        )
        return transaction
      })(),
    [WebAuth, horizon, props.accountID, props.issuerID]
  )

  return <>{props.children(promise)}</>
}

storiesOf("TransactionReviewDialog", module)
  .add("Payment", () => {
    const promise = (async () => {
      const account = await testnetHorizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      return buildTransaction(account, [
        Operation.payment({
          amount: "1.5",
          asset: Asset.native(),
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
        })
      ])
    })()

    return (
      <Async
        promise={promise}
        then={transaction => (
          <TransactionReviewDialogBody
            account={accountStub}
            onClose={doNothing}
            onSubmitTransaction={doNothing}
            showSubmissionProgress={false}
            transaction={transaction}
          />
        )}
        catch={error => <>{error.message}</>}
      />
    )
  })
  .add("Payment with memo", () => {
    const promise = (async () => {
      const account = await testnetHorizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      return buildTransaction(
        account,
        [
          Operation.payment({
            amount: "20",
            asset: Asset.native(),
            destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
          })
        ],
        { memo: Memo.text("Demo transaction") }
      )
    })()

    return (
      <Async
        promise={promise}
        then={transaction => (
          <TransactionReviewDialogBody
            account={accountStub}
            onClose={doNothing}
            onSubmitTransaction={doNothing}
            showSubmissionProgress={false}
            transaction={transaction}
          />
        )}
        catch={error => <>{error.message}</>}
      />
    )
  })
  .add("Account creation & Inflation destination", () => {
    const promise = (async () => {
      const account = await testnetHorizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      return buildTransaction(account, [
        Operation.createAccount({
          startingBalance: "1.0",
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
        }),
        Operation.setOptions({
          inflationDest: "GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT"
        })
      ])
    })()

    return (
      <Async
        promise={promise}
        then={transaction => (
          <TransactionReviewDialogBody
            account={accountStub}
            onClose={doNothing}
            onSubmitTransaction={doNothing}
            showSubmissionProgress={false}
            transaction={transaction}
          />
        )}
        catch={error => <>{error.message}</>}
      />
    )
  })
  .add("Create trustline", () => {
    const promise = (async () => {
      const account = await testnetHorizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      return buildTransaction(account, [
        Operation.changeTrust({
          asset: eurt
        })
      ])
    })()

    return (
      <Async
        promise={promise}
        then={transaction => (
          <TransactionReviewDialogBody
            account={accountStub}
            onClose={doNothing}
            onSubmitTransaction={doNothing}
            showSubmissionProgress={false}
            transaction={transaction}
          />
        )}
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
            then={transaction => (
              <TransactionReviewDialogBody
                account={accountStub}
                onClose={doNothing}
                onSubmitTransaction={doNothing}
                showSubmissionProgress={false}
                transaction={transaction}
              />
            )}
            catch={error => <>{error.message}</>}
          />
        )}
      </SampleWebAuth>
    )
  })
  .add("Merge account", () => {
    const promise = (async () => {
      const account = await testnetHorizon.loadAccount("GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W")
      return buildTransaction(account, [
        Operation.accountMerge({
          source: "GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT",
          destination: "GA2CZKBI2C55WHALSTNPG54FOQCLC6Y4EIATZEIJOXWQPSEGN4CWAXFT"
        })
      ])
    })()

    return (
      <Async
        promise={promise}
        then={transaction => (
          <TransactionReviewDialogBody
            account={accountStub}
            onClose={doNothing}
            onSubmitTransaction={doNothing}
            showSubmissionProgress={false}
            transaction={transaction}
          />
        )}
        catch={error => <>{error.message}</>}
      />
    )
  })
