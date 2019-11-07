#!/bin/bash

PLATFORM="$1"
ENV_FILE="signing-$PLATFORM.env"

if [ -f "./$ENV_FILE" ]; then
  echo "Loading signing config from $ENV_FILE..."
  source "./$ENV_FILE"
fi

echo "Code Signing Password: "
read -s CSC_KEY_PASSWORD

export CSC_LINK
export CSC_KEY_PASSWORD

if [ "$PLATFORM" = "mac" ]; then
  if [ -z "$APPLE_ID_PASSWORD" ]; then
    echo "Password for Apple ID $APPLE_ID:"
    read -s APPLE_ID_PASSWORD
  fi

  export APPLE_ID
  export APPLE_ID_PASSWORD
fi
