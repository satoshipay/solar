#!/bin/bash
# source: https://stackoverflow.com/a/38595160

cd "$(dirname $0)"

sedi () {
  sed --version >/dev/null 2>&1 && sed -i -- "$@" || sed -i "" "$@"
}

sedi '/^.*<uses-sdk/d' ../platforms/android/CordovaLib/AndroidManifest.xml
sedi '/^.*<uses-sdk/d' ../platforms/android/app/src/main/AndroidManifest.xml

# substitute 3.0.2 with 3.3.2 in the line which contains 'com.android.tools.build:gradle'
sedi '/com.android.tools.build:gradle/s/3.0.1/3.3.2/g' ../platforms/android/build.gradle