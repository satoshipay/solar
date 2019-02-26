#!/bin/bash

if [ -f ./signing.env ]; then
  echo "Loading signing config from signing.env..."
  source ./signing.env
fi

echo "Code Signing Password: "
read -s CSC_KEY_PASSWORD

export CSC_LINK
export CSC_KEY_PASSWORD
