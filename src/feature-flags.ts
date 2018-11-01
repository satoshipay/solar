function fail(message: string): never {
  throw new Error(message)
}

export const isMultisigEnabled = () => Boolean(process.env.FEATURE_MULTISIG)

export const getMultisigServiceURL = () => process.env.MULTISIG_SERVICE || fail("MULTISIG_SERVICE not set.")
