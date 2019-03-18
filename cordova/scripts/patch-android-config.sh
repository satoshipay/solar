#!/bin/bash
sed -i '' '/^.*<uses-sdk/d' platforms/android/CordovaLib/AndroidManifest.xml
sed -i '' '/^.*<uses-sdk/d' platforms/android/app/src/main/AndroidManifest.xml

# substitute 3.0.2 with 3.3.2 in the line which contains 'com.android.tools.build:gradle'
sed -i '' '/com.android.tools.build:gradle/s/3.0.1/3.3.2/g' platforms/android/build.gradle