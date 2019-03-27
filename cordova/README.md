# Solar mobile apps

## Development

Install the dependencies:

```
npm install
```

Navigate to cordova folder:

```
cd cordova/
```

Install cordova dependencies:

```
npm install
```

### Android

Create the Android platform:

```
npm run install:android
```

Create the development build:

```
npm run dev:android
```

Follow the steps in [Cordova Android - Installing the Requirements](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#installing-the-requirements) to setup your development environment.

In Android Studio choose "Import project" and select the `cordova/platforms/android` folder.
You should now be able to run the app on device or emulator.

### iOS

Create the iOS platform:

```
npm run install:ios
```

Create the development build:

```
npm run dev:ios
```

Troubleshooting: In case you see the infamous `error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance`, you need to run:

```
sudo xcode-select -switch /Applications/Xcode.app/Contents/Developer
```

Follow the steps in [Cordova iOS - Installing the Requirements](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html#installing-the-requirements) to setup your development environment.

Open the Project folder in Xcode:

```
open ./platforms/ios/Solar.xcworkspace/
```

You can now select a device from the dropdown in the upper-left corner and run the application.

## Production build

Follow the setup of the development builds but instead of `npm run dev:android/ios` use:

```
npm run build:android
npm run build:ios
```
