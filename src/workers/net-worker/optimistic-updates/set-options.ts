import { Horizon, Operation, Signer, Transaction } from "stellar-sdk"
import { OptimisticUpdate } from "../../lib/optimistic-updates"

function addSigner(
  horizonURL: string,
  operation: Operation.SetOptions,
  signer: Signer.Ed25519PublicKey,
  transaction: Transaction
): OptimisticUpdate<Horizon.AccountResponse> {
  return {
    apply(prevAccountData) {
      return {
        ...prevAccountData,
        signers: [
          ...prevAccountData.signers,
          {
            type: "ed25519_public_key",
            key: signer.ed25519PublicKey,
            weight: signer.weight!
          }
        ]
      }
    },
    effectsAccountID: operation.source || transaction.source,
    horizonURL,
    title: `Add signer ${signer.ed25519PublicKey} (weight ${signer.weight})`,
    transactionHash: transaction.hash().toString("hex")
  }
}

function removeSigner(
  horizonURL: string,
  operation: Operation.SetOptions,
  signer: Signer.Ed25519PublicKey,
  transaction: Transaction
): OptimisticUpdate<Horizon.AccountResponse> {
  return {
    apply(prevAccountData) {
      return {
        ...prevAccountData,
        signers: prevAccountData.signers.filter(
          prevSigner => !(prevSigner.type === "ed25519_public_key" && prevSigner.key === signer.ed25519PublicKey)
        )
      }
    },
    effectsAccountID: operation.source || transaction.source,
    horizonURL,
    title: `Remove signer ${signer.ed25519PublicKey}`,
    transactionHash: transaction.hash().toString("hex")
  }
}

function setMasterWeight(
  horizonURL: string,
  operation: Operation.SetOptions,
  masterWeight: number,
  transaction: Transaction
): OptimisticUpdate<Horizon.AccountResponse> {
  const accountID = operation.source || transaction.source
  return {
    apply(prevAccountData) {
      return {
        ...prevAccountData,
        signers: prevAccountData.signers.map(signer => {
          if (signer.type === "ed25519_public_key" && signer.key === accountID) {
            return {
              ...signer,
              weight: masterWeight
            }
          } else {
            return signer
          }
        })
      }
    },
    effectsAccountID: accountID,
    horizonURL,
    title: `Set master key weight: ${operation.masterWeight}`,
    transactionHash: transaction.hash().toString("hex")
  }
}

function setThresholds(
  horizonURL: string,
  operation: Operation.SetOptions,
  transaction: Transaction
): OptimisticUpdate<Horizon.AccountResponse> {
  return {
    apply(prevAccountData) {
      const thresholds = { ...prevAccountData.thresholds }

      if (operation.lowThreshold !== undefined) {
        thresholds.low_threshold = operation.lowThreshold
      }
      if (operation.medThreshold !== undefined) {
        thresholds.med_threshold = operation.medThreshold
      }
      if (operation.highThreshold !== undefined) {
        thresholds.high_threshold = operation.highThreshold
      }
      return {
        ...prevAccountData,
        thresholds
      }
    },
    effectsAccountID: operation.source || transaction.source,
    horizonURL,
    title: `Set thresholds: ${operation.lowThreshold}/${operation.medThreshold}/${operation.highThreshold}`,
    transactionHash: transaction.hash().toString("hex")
  }
}

function setAccountOptions(
  horizonURL: string,
  operation: Operation.SetOptions,
  transaction: Transaction
): Array<OptimisticUpdate<Horizon.AccountResponse>> {
  const updates: Array<OptimisticUpdate<Horizon.AccountResponse>> = []
  const { signer } = operation

  if (signer && "ed25519PublicKey" in signer && typeof signer.weight === "number" && signer.weight > 0) {
    updates.push(addSigner(horizonURL, operation, signer, transaction))
  } else if (signer && "ed25519PublicKey" in signer && typeof signer.weight === "number" && signer.weight === 0) {
    updates.push(removeSigner(horizonURL, operation, signer, transaction))
  } else if (
    operation.lowThreshold !== undefined ||
    operation.medThreshold !== undefined ||
    operation.highThreshold !== undefined
  ) {
    updates.push(setThresholds(horizonURL, operation, transaction))
  }

  if (operation.masterWeight !== undefined) {
    updates.push(setMasterWeight(horizonURL, operation, operation.masterWeight, transaction))
  }

  return updates
}

export default setAccountOptions
