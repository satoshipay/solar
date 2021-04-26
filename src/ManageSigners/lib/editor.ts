import { Horizon } from "stellar-sdk"
import { AccountData } from "~Generic/lib/account"

export namespace MultisigPresets {
  export enum Type {
    Custom = "Custom",
    OneOutOfN = "OneOutOfN",
    MOutOfN = "MOutOfN",
    SingleSignature = "SingleSignature"
  }

  export interface Custom {
    thresholds: Horizon.AccountThresholds
    type: Type.Custom
  }

  export interface OneOutOfN {
    type: Type.OneOutOfN
  }

  export interface MOutOfN {
    requiredKeyWeight: number
    type: Type.MOutOfN
  }

  export interface SingleSignature {
    type: Type.SingleSignature
  }
}

export type MultisigPreset =
  | MultisigPresets.Custom
  | MultisigPresets.OneOutOfN
  | MultisigPresets.MOutOfN
  | MultisigPresets.SingleSignature

export interface SignersEditorState {
  preset: MultisigPreset
  signersToAdd: Horizon.AccountSigner[]
  signersToRemove: Horizon.AccountSigner[]
}

export function initializeEditorState(accountData: AccountData): SignersEditorState {
  let preset: MultisigPreset

  const keyWeights = accountData.signers.map(signer => signer.weight)
  const maxKeyWeight = Math.max(...keyWeights)
  const minKeyWeight = Math.min(...keyWeights)

  const equalThresholds =
    accountData.thresholds.low_threshold === accountData.thresholds.med_threshold &&
    accountData.thresholds.med_threshold === accountData.thresholds.high_threshold
  const maxThreshold = Math.max(
    accountData.thresholds.low_threshold,
    accountData.thresholds.med_threshold,
    accountData.thresholds.high_threshold
  )

  if (accountData.signers.length <= 1) {
    preset = {
      type: MultisigPresets.Type.SingleSignature
    }
  } else if (minKeyWeight >= maxThreshold) {
    preset = {
      type: MultisigPresets.Type.OneOutOfN
    }
  } else if (minKeyWeight === maxKeyWeight && equalThresholds) {
    preset = {
      requiredKeyWeight: Math.ceil(maxThreshold / minKeyWeight),
      type: MultisigPresets.Type.MOutOfN
    }
  } else {
    preset = {
      thresholds: accountData.thresholds,
      type: MultisigPresets.Type.Custom
    }
  }

  return {
    preset,
    signersToAdd: [],
    signersToRemove: []
  }
}

export function getSignatureThreshold(preset: MultisigPreset) {
  if ("requiredKeyWeight" in preset) {
    return preset.requiredKeyWeight
  } else if ("thresholds" in preset) {
    return Math.max(preset.thresholds.low_threshold, preset.thresholds.med_threshold, preset.thresholds.high_threshold)
  }
}

export function requiresSignatureThreshold(preset: MultisigPreset) {
  return preset.type === MultisigPresets.Type.MOutOfN || preset.type === MultisigPresets.Type.Custom
}
