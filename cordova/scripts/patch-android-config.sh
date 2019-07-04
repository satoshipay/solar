#!/bin/bash
# source: https://stackoverflow.com/a/38595160

cd "$(dirname $0)"

sedi () {
  sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi '/^.*<uses-sdk/d' ../platforms/android/CordovaLib/AndroidManifest.xml
sedi '/^.*<uses-sdk/d' ../platforms/android/app/src/main/AndroidManifest.xml

sedi 's/package="io.solarwallet"/package="io.solarwallet" xmlns:tools="http:\/\/schemas.android.com\/tools"/' ../platforms/android/app/src/main/AndroidManifest.xml

sedi 's/defaultMinSdkVersion=19/defaultMinSdkVersion=21/' ../platforms/android/build.gradle
