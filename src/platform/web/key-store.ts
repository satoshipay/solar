import { createStore, KeysData } from "key-store"
import { PrivateKeyData, PublicKeyData } from "../types"

const initialKeys: KeysData<PublicKeyData> = {
  "1": {
    metadata: {
      nonce: "19sHNxecdiik6chwGFgZVk9UJoG2k8B+",
      iterations: 10000
    },
    public: {
      name: "Test account",
      password: false,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true
    },
    private:
      "F6SxXmjdLgxPI3msiNWZ7RGHoBwYEdFICLHJqzIZOADn71lfBYFD/qvQxcD9L1Wq495cDek0RlNLGF2fNK8P48A+B7Hfk8hWL+o5EbPd1ql20r7SfxVh9o0="
  },
  "2": {
    metadata: {
      nonce: "PvRwEZlBBIdwo3BPrPCxMpjsxmDbQI1r",
      iterations: 10000
    },
    public: {
      name: "Test account with password",
      password: true,
      publicKey: "GBPBFWVBADSESGADWEGC7SGTHE3535FWK4BS6UW3WMHX26PHGIH5NF4W",
      testnet: true
    },
    private:
      "5VzbN/Y5S1CfizJnnIejm8ku4KsG5cPvRht6BoZ8HalOOKdOt66Ra/rjoNlMbh45Et+25iGggzj+IlFvpepmuaEFcdqj5myEJspcy4GGwn+9TtA+KmUDcRI="
  }
}

export default function createKeyStore() {
  // TODO: Create a store that is using persistent storage (#23)
  return createStore<PrivateKeyData, PublicKeyData>(() => undefined, initialKeys)
}
