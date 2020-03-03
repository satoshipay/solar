#!/bin/bash

ENV_FILE="signing.env"

if [ -f "./$ENV_FILE" ]; then
  echo "Loading signing config from $ENV_FILE..."
  source "./$ENV_FILE"
fi

if [ -z "$KEYSTORE_LOCATION" ]; then
  echo "KEYSTORE_LOCATION not set"
  exit 1
fi

if [ -z "$SIGNINGKEY_ALIAS" ]; then
  echo "SIGNINGKEY_ALIAS not set"
  exit 1
fi

echo "Keystore Password: "
read -s KEYSTORE_PASSWORD

echo "Key Password: "
read -s SIGNINGKEY_PASSWORD

export CORDOVA_ANDROID_GRADLE_DISTRIBUTION_URL
export JAVA_HOME
export KEYSTORE_LOCATION
export KEYSTORE_PASSWORD
export SIGNINGKEY_ALIAS
export SIGNINGKEY_PASSWORD
