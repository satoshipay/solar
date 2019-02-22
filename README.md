# Solar Wallet (Beta)

User-friendly Stellar wallet app, featuring multi-signature, custom assets management and more.

Runs on Mac OS, Windows & Linux. Mobile app coming soon.

## Download

See <https://github.com/satoshipay/solar/releases>. You will find the binaries there.

## Key security

Keys are encrypted with a key derived from the user's password before storing them on the local filesystem. That means that the user's secret key is safe as long as their password is strong enough. However, if they forget their password there will be no way of recovering the secret key. That's why you should always make a backup of your secret key.

The encryption key is derived from the password using `PBKDF2` with `SHA256`. The actual encryption is performed using `xsalsa20-poly1305`.

## Development

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

### Production build

```
npm run build:mac
npm run build:win
npm run build:linux
```

To sign the binaries, make sure you imported the code signing certificate into your keychain. Create a `signing.env` file with the following content:

```
CSC_NAME="SatoshiPay Ltd"   # or whatever the name of the certificate in your keychain is
```

Signing should then happen automatically during the production build.

Note: Application signing has only been tested on a Mac OS development machine so far.

## License

GPL v3
