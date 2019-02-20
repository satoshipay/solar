import BigNumber from "big.js"
import { useContext, useEffect } from "react"
import { Asset, Horizon, Server } from "stellar-sdk"
import { Account, AccountsContext } from "../context/accounts"
import { SignatureDelegationContext } from "../context/signatureDelegation"
import { useAccountEffectSubscriptions, useRouter } from "../hooks"
import { SignatureRequest } from "../lib/multisig-service"
import * as routes from "../routes"
import { OfferDetailsString } from "./TransactionSummary/Operations"

type TradeEffect = Server.EffectRecord & {
  id: string
  account: string
  bought_amount: string
  bought_asset_type: Horizon.BalanceLineAsset["asset_type"] | Horizon.BalanceLineNative["asset_type"]
  bought_asset_code?: Horizon.BalanceLineAsset["asset_code"]
  bought_asset_issuer?: Horizon.BalanceLineAsset["asset_issuer"]
  offer_id: number
  seller: string
  sold_amount: string
  sold_asset_type: Horizon.BalanceLineAsset["asset_type"] | Horizon.BalanceLineNative["asset_type"]
  sold_asset_code?: Horizon.BalanceLineAsset["asset_code"]
  sold_asset_issuer?: Horizon.BalanceLineAsset["asset_issuer"]
  type: "trade"
  type_i: 33
}

const isTradeEffect = (effect: Server.EffectRecord): effect is TradeEffect => effect.type === "trade"

function DesktopNotifications() {
  const { accounts } = useContext(AccountsContext)
  const { subscribeToNewSignatureRequests } = useContext(SignatureDelegationContext)
  const router = useRouter()

  const handleNewSignatureRequest = (signatureRequest: SignatureRequest) => {
    const signersHavingSigned = signatureRequest._embedded.signers.filter(signer => signer.has_signed)

    const notification = new Notification("New transaction to co-sign", {
      body: `From ${signersHavingSigned.map(signer => signer.account_id).join(", ")}`
    })
    notification.addEventListener("click", () => router.history.push(routes.allAccounts()))
  }

  useEffect(() => {
    const unsubscribeFromNewSignatureRequests = subscribeToNewSignatureRequests(handleNewSignatureRequest)
    return unsubscribeFromNewSignatureRequests
  }, [])

  useAccountEffectSubscriptions(accounts, (account: Account, effect: Server.EffectRecord) => {
    if (isTradeEffect(effect)) {
      const buying =
        effect.bought_asset_code && effect.bought_asset_issuer
          ? new Asset(effect.bought_asset_code, effect.bought_asset_issuer)
          : Asset.native()
      const selling =
        effect.sold_asset_code && effect.sold_asset_issuer
          ? new Asset(effect.sold_asset_code, effect.sold_asset_issuer)
          : Asset.native()

      const body = OfferDetailsString({
        amount: BigNumber(effect.sold_amount),
        price: BigNumber(effect.bought_amount).div(effect.sold_amount),
        buying,
        selling
      })

      const notification = new Notification(`DEX trade completed | ${account.name}`, { body })
      notification.addEventListener("click", () => router.history.push(routes.account(account.id)))
    }
  })

  return null
}

export default DesktopNotifications
