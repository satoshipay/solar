#!/bin/bash

ENV_FILE="signing.env"

if [ -f "./$ENV_FILE" ]; then
  echo "Loading signing config from $ENV_FILE..."
  source "./$ENV_FILE"
fi

echo "Keystore Password: "
read -s KEYSTORE_PASSWORD

echo "Key Password: "
read -s SIGNINGKEY_PASSWORD

export KEYSTORE_LOCATION
export KEYSTORE_PASSWORD
export SIGNINGKEY_ALIAS
export SIGNINGKEY_PASSWORD
