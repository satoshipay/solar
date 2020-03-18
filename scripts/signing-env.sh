#!/bin/bash

PLATFORM="$1"   # "linux", "mac" or "win"
ENV_FILE="signing-$PLATFORM.env"

if [ -f "./$ENV_FILE" ]; then
  echo "Loading signing config from $ENV_FILE..."
  source "./$ENV_FILE"
else
  echo "Warning: Application binaries will not be signed."
fi

if [ -f "./$ENV_FILE" ] && [ "$PLATFORM" = "win" ]; then
  echo "Code Signing Password: "
  read -s CSC_KEY_PASSWORD
elif [ -f "./$ENV_FILE" ] && [ "$PLATFORM" = "mac" ] && [ -z "$APPLE_ID_PASSWORD" ]; then
  echo "Password for Apple ID $APPLE_ID:"
  read -s APPLE_ID_PASSWORD
fi

export APPLE_ID
export APPLE_ID_PASSWORD
export CSC_LINK
export CSC_KEY_PASSWORD
