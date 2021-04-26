# Contributing to Solar

Thanks for your willingness to contribute. 🙌
If you contribute to this project, you agree to release your work under the license of this project.

## Submitting changes

There is a git hook set up which is automatically enabled when you install dependencies. This will automatically run `prettier` when creating a commit to make sure the code format is consistent. You can temporarily disable this hook by adding a `--no-verify` flag to your commit command.

To submit your changes please open a [GitHub Pull Request](https://docs.github.com/en/free-pro-team@latest/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) with a clear description of what you've done.

## Contributing translations

This project uses [i18next](https://www.i18next.com/) for internationalization. We made efforts to replace all hard-coded strings and set the application up for internationalization but due to limited resources we decided to make the process of adding translations a community effort. Thus all contributions of translations to this project are very welcome and appreciated.

#### Contributing translations for a new language

The following set of instructions is meant to guide you through the whole process of contributing translations for a new language: (_Note:_ Words in curly braces have to be replaced according to context/language.)

1. Fork this project and create a new branch called `feature/add-{language}-translations`
1. Checkout the new branch
1. Create a new folder for the locale you want to contribute at `{project-root}/i18n/locales/{language-code}` (choose the corresponding two-letter language code from [this](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) list of ISO 639-1 codes)
1. Copy all files from the folder [i18n/locales/en](./i18n/locales/en) to the one you just created
1. Replace the strings in the copied files with your translations
   - Do not change values contained in double curly braces (`{{...}}`), these are used by [i18next](https://www.i18next.com/translation-function/interpolation) to integrate dynamic values into the translations
   - Be precise regarding capitalization, i.e. start translated strings with uppercase/lowercase letters according to the english locale
1. Copy the file [i18n/en.ts](./i18n/en.ts) and paste it into the same directoy renaming it to `{project-root}/i18n/{language-code}.ts`
1. Open the new file and adjust the paths of the `import` statements
   (e.g. replace `import App from "./locales/en/app.json"` with `import App from "./locales/{language-code}/app.json"`)
1. Add your language code to the list of available languages in [i18n/index.ts](./i18n/index.ts)
1. Open [src/App/i18n.ts](./src/App/i18n.ts) and add a new `import translation{LANGUAGE-CODE} from "../../i18n/{language-code}"` statement as well as your new locale to the `resources` object

**Note**: The english locale should always be used for reference, i.e. you should base your translations on the contents of [i18n/locales/en](./i18n/locales/en).

Afterwards you can test if everything works fine by locally running the [development](./README.md#development) enviroment.
You can change the displayed language in the applications settings menu.

Once done you can submit a new pull request from your fork to the upstream repository.

#### Contributing changes to existing languages

If you notice wrong or missing translations for supported languages (i.e. some parts of the application are displayed in english although a different language is selected) you are welcome to contribute a change.

In case you want to fix a wrong translation you can find all translations in the [i18n/locales](./i18n/locales) directory. The easiest way to find the file you need to change might be to use GitHubs built-in search engine to search the repository for the wrong string.

In case you want to add missing translations you'd first have to find the english string that you want to translate. You can find all english translations in the [i18n/locales/en](./i18n/locales/en) directory. Afterwards you can use the `key` of that string value to add the missing translation for the other language.

**Example**: Let's assume you notice the string "Add funds" is not translated in the account settings menu.
You can then use GitHubs search engine to search the repository for `"Add funds"`.
There are two occurences, one in `i18n/locales/en/transfer-service.json` and another in `i18n/locales/en/account.json`.
Because it is displayed in the account settings menu you know that out of these two files the one you are looking for is `account.json`.
We can see that `"Add funds"` is used in `"context-menu": { ..., "deposit": {"label": "Add funds"}, ... }`.
Now you can navigate to `i18n/locales/{other-language}/account.json` and look if the `context-menu` object also contains an entry similar to `"deposit":"{"label":"Add funds"}` (which it probably does not but you should be able to find the issue from here).
