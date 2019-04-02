#!/bin/bash

ENVIRONMENT="$1"
PLATFORM="$2"
TEMPLATE_FILE="config.template"

cd "$(dirname $0)"

if [ -f "../config/$TEMPLATE_FILE" ]; then
  echo "Creating config file from $TEMPLATE_FILE ..."

  export HTML_ENTRYPOINT="index.$ENVIRONMENT-$PLATFORM.html"
  export PACKAGE_VERSION="$(cat ../../package.json | ../node_modules/.bin/json version)"
  export ANDROID_VERSIONCODE="$(date +%s)"
  export IOS_BUNDLE_VERSION="$PACKAGE_VERSION.$(date +%s)"

  if [ $PLATFORM == 'ios' ]
  then
    export SPLASH_SCREEN_DELAY="3000"
  else 
    export SPLASH_SCREEN_DELAY="0"
  fi

  ./envsubst.js ../config/config.template > ../config.xml
fi