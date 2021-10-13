import BigNumber from "big.js"
import { TFunction } from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, ServerApi } from "stellar-sdk"
import { Trade } from "stellar-sdk/lib/types/trade"
import { useHorizonURLs } from "~Generic/hooks/stellar"
import { useLiveAccountEffects } from "~Generic/hooks/stellar-subscriptions"
import { useRouter } from "~Generic/hooks/userinterface"
import { useSingleton } from "~Generic/hooks/util"
import { useNetWorker } from "~Generic/hooks/workers"
import { MultisigTransactionResponse } from "~Generic/lib/multisig-service"
import { showNotification } from "~Platform/notifications"
import { formatBalance } from "~Generic/lib/balances"
import { OfferDetailsString } from "~TransactionReview/components/Operations"
import { NetWorker } from "~Workers/worker-controller"
import { Account, AccountsContext } from "../contexts/accounts"
import { trackError } from "../contexts/notifications"
import { SignatureDelegationContext } from "../contexts/signatureDelegation"
import * as routes from "../routes"
import { AccountCredited } from "stellar-sdk/lib/types/effects"

const isTradeEffect = (effect: ServerApi.EffectRecord): effect is Trade => effect.type === "trade"
const isPaymentEffect = (effect: ServerApi.EffectRecord) =>
  effect.type === "account_credited" || effect.type === "account_debited"

function createEffectHandlers(
  router: ReturnType<typeof useRouter>,
  netWorker: NetWorker,
  mainnetHorizonURLs: string[],
  testnetHorizonURLs: string[],
  t: TFunction
) {
  return {
    async handleTradeEffect(account: Account, effect: Trade) {
      const buying =
        effect.bought_asset_code && effect.bought_asset_issuer
          ? new Asset(effect.bought_asset_code, effect.bought_asset_issuer)
          : Asset.native()
      const selling =
        effect.sold_asset_code && effect.sold_asset_issuer
          ? new Asset(effect.sold_asset_code, effect.sold_asset_issuer)
          : Asset.native()

      const horizonURL = account.testnet ? testnetHorizonURLs : mainnetHorizonURLs
      const openOffers = await netWorker.fetchAccountOpenOrders(horizonURL, account.accountID)

      const orderOnlyPartiallyExecuted = openOffers._embedded.records.find(
        offer => String(offer.id) === String(effect.offer_id)
      )

      if (orderOnlyPartiallyExecuted) {
        return
      }

      const title = t("app.notification.desktop.trade-completed.title", `Trade completed | ${account.name}`, {
        account: account.name
      })
      const notificationBody = OfferDetailsString(
        {
          amount: BigNumber(effect.sold_amount),
          price: BigNumber(effect.bought_amount).div(effect.sold_amount),
          buying,
          selling
        },
        t
      )

      showNotification({ title, text: notificationBody }, () => router.history.push(routes.account(account.id)))
    },
    async handlePaymentEffect(account: Account, effect: ServerApi.EffectRecord) {
      if (effect.type === "account_credited" && effect.account === account.accountID) {
        const paymentEffect = effect as AccountCredited
        const title = t("app.notification.desktop.received-payment.title", `Received payment | ${account.name}`, {
          account: account.name
        })
        const notificationBody = t(
          "app.notification.desktop.received-payment.body",
          `Received ${formatBalance(paymentEffect.amount)} ${paymentEffect.asset_code || "XLM"}`,
          {
            amount: formatBalance(paymentEffect.amount),
            assetCode: paymentEffect.asset_code || "XLM"
          }
        )

        showNotification({ title, text: notificationBody }, () => router.history.push(routes.account(account.id)))
      }
    }
  }
}

function DesktopNotifications() {
  const { accounts } = React.useContext(AccountsContext)
  const { subscribeToNewSignatureRequests } = React.useContext(SignatureDelegationContext)

  const mainnetHorizonURLs = useHorizonURLs(false)
  const testnetHorizonURLs = useHorizonURLs(true)
  const netWorker = useNetWorker()
  const router = useRouter()
  const { t } = useTranslation()

  const effectHandlers = useSingleton(() =>
    createEffectHandlers(router, netWorker, mainnetHorizonURLs, testnetHorizonURLs, t)
  )

  const handleNewSignatureRequest = React.useCallback(
    (signatureRequest: MultisigTransactionResponse) => {
      const signersNotHavingSigned = signatureRequest.signers.filter(
        signer => signatureRequest.signed_by.indexOf(signer) === -1
      )
      const accountPublicKeys = accounts.map(account => account.publicKey)

      // only show notification when a local account has to co-sign
      if (signersNotHavingSigned.some(signer => accountPublicKeys.includes(signer))) {
        showNotification(
          {
            title: t("app.notification.desktop.new-signature-request.title"),
            text: t(
              "app.notification.desktop.new-signature-request.title",
              `From ${signatureRequest.signed_by.join(", ")}`,
              { signersHavingSigned: signatureRequest.signed_by.join(", ") }
            )
          },
          () => router.history.push(routes.allAccounts())
        )
      }
    },
    [accounts, router.history, t]
  )

  React.useEffect(() => {
    const unsubscribeFromNewSignatureRequests = subscribeToNewSignatureRequests(handleNewSignatureRequest)
    return unsubscribeFromNewSignatureRequests
  }, [handleNewSignatureRequest, subscribeToNewSignatureRequests])

  useLiveAccountEffects(accounts, (account: Account, effect: ServerApi.EffectRecord) => {
    if (isTradeEffect(effect)) {
      effectHandlers.handleTradeEffect(account, effect).catch(trackError)
    } else if (isPaymentEffect(effect)) {
      effectHandlers.handlePaymentEffect(account, effect).catch(trackError)
    }
  })

  return null
}

export default React.memo(DesktopNotifications)
