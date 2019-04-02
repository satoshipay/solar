#!/bin/bash

ENVIRONMENT="$1"
PLATFORM="$2"
TEMPLATE_FILE="config.template"

if [ -f "./config/$TEMPLATE_FILE" ]; then
  echo "Creating config file from $TEMPLATE_FILE ..."

  export CONTENT_FILE="index.$ENVIRONMENT-$PLATFORM.html"

  if [ $PLATFORM == 'ios' ]
  then
    export SPLASH_SCREEN_DELAY="3000"
  else 
    export SPLASH_SCREEN_DELAY="0"
  fi
fi