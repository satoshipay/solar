import BigNumber from "big.js"
import { TFunction } from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import { Asset, Horizon, ServerApi } from "stellar-sdk"
import { useHorizonURL } from "~Generic/hooks/stellar"
import { useLiveAccountEffects } from "~Generic/hooks/stellar-subscriptions"
import { useRouter } from "~Generic/hooks/userinterface"
import { useSingleton } from "~Generic/hooks/util"
import { useNetWorker } from "~Generic/hooks/workers"
import { SignatureRequest } from "~Generic/lib/multisig-service"
import { showNotification } from "~Platform/notifications"
import { formatBalance } from "~Generic/lib/balances"
import { OfferDetailsString } from "~TransactionReview/components/Operations"
import { NetWorker } from "~Workers/worker-controller"
import { Account, AccountsContext } from "../contexts/accounts"
import { trackError } from "../contexts/notifications"
import { SignatureDelegationContext } from "../contexts/signatureDelegation"
import * as routes from "../routes"

type TradeEffect = ServerApi.EffectRecord & {
  id: string
  account: string
  bought_amount: string
  bought_asset_type: Horizon.BalanceLine["asset_type"]
  bought_asset_code?: Horizon.BalanceLineAsset["asset_code"]
  bought_asset_issuer?: Horizon.BalanceLineAsset["asset_issuer"]
  offer_id: number
  seller: string
  sold_amount: string
  sold_asset_type: Horizon.BalanceLine["asset_type"]
  sold_asset_code?: Horizon.BalanceLineAsset["asset_code"]
  sold_asset_issuer?: Horizon.BalanceLineAsset["asset_issuer"]
  type: "trade"
  type_i: 33
}

const isTradeEffect = (effect: ServerApi.EffectRecord): effect is TradeEffect => effect.type === "trade"
const isPaymentEffect = (effect: ServerApi.EffectRecord) =>
  effect.type === "account_credited" || effect.type === "account_debited"

function createEffectHandlers(
  router: ReturnType<typeof useRouter>,
  netWorker: NetWorker,
  mainnetHorizonURL: string,
  testnetHorizonURL: string,
  t: TFunction
) {
  return {
    async handleTradeEffect(account: Account, effect: TradeEffect) {
      const buying =
        effect.bought_asset_code && effect.bought_asset_issuer
          ? new Asset(effect.bought_asset_code, effect.bought_asset_issuer)
          : Asset.native()
      const selling =
        effect.sold_asset_code && effect.sold_asset_issuer
          ? new Asset(effect.sold_asset_code, effect.sold_asset_issuer)
          : Asset.native()

      const horizonURL = account.testnet ? testnetHorizonURL : mainnetHorizonURL
      const openOffers = await netWorker.fetchAccountOpenOrders(horizonURL, account.publicKey)

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
      if (effect.type === "account_credited" && effect.account === account.publicKey) {
        const title = t("app.notification.desktop.received-payment.title", `Received payment | ${account.name}`, {
          account: account.name
        })
        const notificationBody = t(
          "app.notification.desktop.received-payment.body",
          `Received ${formatBalance(effect.amount)} ${effect.asset_code || "XLM"}`,
          {
            amount: formatBalance(effect.amount),
            assetCode: effect.asset_code || "XLM"
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

  const mainnetHorizonURL = useHorizonURL(false)
  const testnetHorizonURL = useHorizonURL(true)
  const netWorker = useNetWorker()
  const router = useRouter()
  const { t } = useTranslation()

  const effectHandlers = useSingleton(() =>
    createEffectHandlers(router, netWorker, mainnetHorizonURL, testnetHorizonURL, t)
  )

  const handleNewSignatureRequest = React.useCallback(
    (signatureRequest: SignatureRequest) => {
      const signersHavingSigned = signatureRequest._embedded.signers.filter(signer => signer.has_signed)
      const signersNotHavingSigned = signatureRequest._embedded.signers.filter(signer => !signer.has_signed)
      const accountPublicKeys = accounts.map(account => account.publicKey)

      // only show notification when a local account has to co-sign
      if (signersNotHavingSigned.some(signer => accountPublicKeys.includes(signer.account_id))) {
        showNotification(
          {
            title: t("app.notification.desktop.new-signature-request.title"),
            text: t(
              "app.notification.desktop.new-signature-request.title",
              `From ${signersHavingSigned.map(signer => signer.account_id).join(", ")}`,
              { signersHavingSigned: signersHavingSigned.map(signer => signer.account_id).join(", ") }
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
