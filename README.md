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

## Contributing translations

This project uses [i18next](https://www.i18next.com/) for internationalization.
Because of limited resources we decided to make this a community effort.
Thus all contributions of translations to this project are very welcome and appreciated.

If you want to contribute translations for a new language follow the steps below: (_Note:_ Words in curly braces have to be replaced according to context/language.)

1. Fork this project and create a new branch called `feature/add-{language}-translations`
1. Checkout the new branch
1. Create a new folder for the locale you want to contribute at `{project-root}/i18n/locales/{language-code}` (choose the corresponding two-letter language code from [this](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) list of ISO 639-1 codes)
1. Copy all files from the folder `{project-root}/i18n/locales/en` to the one you just created
1. Replace the strings in the copied files with your translations
   - Do not change values contained in double curly braces (`{{...}}`), these are used by [i18next](https://www.i18next.com/translation-function/interpolation) to integrate dynamic values into the translations
   - Be precise regarding capitalization, i.e. start translated strings with uppercase/lowercase letters according to the english locale
1. Copy the file `{project-root}/i18n/en.ts` and paste it into the same directoy renaming it to `{project-root}/i18n/{language-code}.ts`
1. Open the new file and adjust the paths of the `import` statements
   (e.g. replace `import App from "./locales/en/app.json"` with `import App from "./locales/{language-code}/app.json"`)
1. Add your language code to the list of available languages in `{project-root}/i18n/index.ts`
1. Open `{project-root}/src/App/i18n.ts` and add a new `import translation{LANGUAGE-CODE} from "../../i18n/{language-code}"` statement as well as your new locale to the `resources` object

**Note**: The english locale should always be used for reference, i.e. you should base your translations on the contents of [i18n/locales/en](./i18n/locales/en).

Afterwards you can test if everything works fine by locally running the [development](#development) enviroment.
You can change the displayed language in the applications settings menu.

Once done you can submit a new pull request from your fork to the upstream repository.

## License

MIT
