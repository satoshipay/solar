import { Keypair } from 'stellar-sdk'

export function derivePublicKey (privateKey) {
  return Keypair.fromSecret(privateKey).publicKey()
}
