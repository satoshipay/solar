# Solar Wallet (Beta)

User-friendly Stellar wallet app, featuring multi-signature, custom assets management and more.

Runs on Mac OS, Windows & Linux. Mobile app coming soon.

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

To sign the binaries, make sure you have the code signing certificate on your local filesystem as a `.p12` file and have the password for it. Make sure not to save the certificate in the Solar directory to make sure it cannot accidentally be bundled into the app installer!

You can create a `signing.env` file to set the CSC_LINK variable:

```
CSC_LINK=~/secret-certificates/SatoshiPayLtd.p12   # point to your local certificate file
```

Now run `npm run build:*:signed` to create a signed application build.

To check the Mac DMG signature, run `codesign -dv --verbose=4 ./electron/dist/<file>`. To verify the Windows installer signature, you can upload the file to `virustotal.com`.

Note: Application signing has only been tested on a Mac OS development machine so far.

#### Android/iOS

See [Cordova build readme](./cordova/README.md).

## License

GPL v3
