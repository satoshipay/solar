<h1 align="center">Solar Wallet</h1>

<p align="center">
  <a href="https://github.com/satoshipay/solar/releases/latest">
    <img alt="Latest stable release" src="https://badgen.net/github/release/satoshipay/solar/stable" />
  </a>
  <a href="https://github.com/satoshipay/solar/releases/latest">
    <img alt="MacOS" src="https://badgen.net/badge/icon/MacOS?icon=apple&label&color=cyan" />
  </a>
  <a href="https://github.com/satoshipay/solar/releases/latest">
    <img alt="Windows" src="https://badgen.net/badge/icon/Windows?icon=windows&label&color=cyan" />
  </a>
  <a href="https://github.com/satoshipay/solar/releases/latest">
    <img alt="Android" src="https://badgen.net/badge/icon/Android?icon=googleplay&label&color=cyan" />
  </a>
  <a href="https://github.com/satoshipay/solar/releases/latest">
    <img alt="iOS" src="https://badgen.net/badge/icon/iOS?icon=apple&label&color=cyan" />
  </a>
</p>

<br />

User-friendly Stellar wallet, featuring multi-signature, custom assets management and more.

Runs on Mac OS, Windows, Linux, Android and iOS.

## Download

See <https://github.com/satoshipay/solar/releases>. You will find the binaries there.

## Key security

Keys are encrypted with a key derived from the user's password before storing them on the local filesystem. That means that the user's secret key is safe as long as their password is strong enough. However, if they forget their password there will be no way of recovering the secret key. That's why you should always make a backup of your secret key.

The encryption key is derived from the password using `PBKDF2` with `SHA256`. The actual encryption is performed using `xsalsa20-poly1305`.

## Development

### Desktop

Install the dependencies first:

```
npm install
```

To run the app in development mode:

```
npm run dev

# On Mac OS:
PLATFORM=darwin npm run dev
```

To run the tests:

```
npm test
```

To run the storybook:

```
npm run storybook
```

### Run dev server without electron

```
cd web/
npm run dev
```

### Android/iOS

See [Cordova build readme](./cordova/README.md).

### Production build

#### Desktop

```
npm run build:mac
npm run build:win
npm run build:linux
```

#### Building windows binaries on macOS

Starting with macOS Catalina 32-bit executables are not supported. This means that the windows binaries cannot be build natively. One can circumvent this issue by using docker for building the windows binaries. Details are documented [here](https://www.electron.build/multi-platform-build#build-electron-app-using-docker-on-a-local-machine). Since Solar is using Squirrel.Windows the `electronuserland/builder:wine-mono` image should be used.

To run the docker container use:

```
docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 -v /Volumes/Certificates/solar:/root/Certs \
 electronuserland/builder:wine-mono bash -c 'npm config set script-shell bash && npm install && npm run build:win:signed'
 ```

### Signed binaries

To sign the binaries, make sure you have the code signing certificates on your local filesystem as a `.p12` file and have the password for them. Make sure not to save the certificates in the Solar directory in order to not accidentally bundling them into the app installer!

You can create a `signing-mac.env` and a `signing-win.env` file, pointing `electron-builder` to the right certificate to use for each target platform:

```
CSC_LINK=~/secret-certificates/SatoshiPayLtd.p12   # point to your local certificate file
```

Now run `npm run build:*:signed` to create a signed application build. You will be prompted for the certificate's password.

To check the Mac DMG signature, run `codesign -dv --verbose=4 ./electron/dist/<file>`. To verify the Windows installer signature, you can upload the file to `virustotal.com`.

Newer versions of Mac OS require apps to be notarized. The `build:mac:signed` script will notarize the app. For this to succeed, you also need to add your Apple ID to your `signing-mac.env` file:

```
APPLE_ID=me@crypto.rocks
```

Note: Application signing has only been tested on a Mac OS development machine so far.

#### Android/iOS

See [Cordova build readme](./cordova/README.md).

## License

MIT
