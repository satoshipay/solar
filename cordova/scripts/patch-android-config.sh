#!/bin/bash
# source: https://stackoverflow.com/a/38595160

cd "$(dirname $0)"

sedi () {
  sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi '/^.*<uses-sdk/d' ../platforms/android/CordovaLib/AndroidManifest.xml
sedi '/^.*<uses-sdk/d' ../platforms/android/app/src/main/AndroidManifest.xml

sedi '18 a\ 
<uses-sdk tools:overrideLibrary="org.apache.cordova"/> \
' ../platforms/android/app/src/main/AndroidManifest.xml

sedi 's/package="io.solarwallet"/package="io.solarwallet" xmlns:tools="http:\/\/schemas.android.com\/tools"/' ../platforms/android/app/src/main/AndroidManifest.xml

sedi '170 a\ 
targetSdkVersion 28 \
' ../platforms/android/app/build.gradle
sedi '171 a\ 
minSdkVersion 21 \
' ../platforms/android/app/build.gradle
sedi '73 a\ 
defaultConfig { \
minSdkVersion 21 \
}' ../platforms/android/CordovaLib/build.gradle
