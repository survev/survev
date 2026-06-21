/**
 * Localization file for Stats v2.
 */

// TODO: Redo all of these localization files and merge them with the main game ones.
import english from "../../en_stats.json";
// import english from "../../en.json";

function downloadFile(
    file: string,
    onComplete: (err: any, data?: Record<string, string>) => void,
) {
    fetch(file, { method: "GET" })
        .then(data => data.json())
        .then(data => onComplete(null, data))
        .catch(err => onComplete(err));
}

export const Locales = {
    // da: "Dansk",
    // de: "Deutsch",
    en: "English",
    es: "Español",
    // fr: "Français",
    // it: "Italiano",
    // nl: "Nederlands",
    // pl: "Polski",
    // pt: "Português",
    // ru: "Русский",
    // sv: "Svenska",
    // vn: "Tiếng Việt",
    // tr: "Türkçe",
    jp: "日本語",
    // ko: "한국어",
    // th: "ภาษาไทย",
    // "zh-cn": "中文简体",
    // "zh-tw": "中文繁體",
};

export type Locale = keyof typeof Locales;

export class Localization {
    readonly acceptedLocales: Locale[] = Object.keys(Locales) as Locale[];
    translations: Record<string, Record<string, string>> = {
        en: english,
    };

    locale: Locale = $state(this.detectLocale());

    detectLocale(): Locale {
        let detectedLocale = (navigator.language || navigator.userLanguage).toLowerCase();
        const languageWildcards = ["es", "en", "jp"];
        // const languageWildcards = ["pt", "de", "es", "fr", "ko", "ru", "en"];

        for (let i = 0; i < languageWildcards.length; i++) {
            if (detectedLocale.includes(languageWildcards[i])) {
                detectedLocale = languageWildcards[i];
                break;
            }
        }

        for (let i = 0; i < this.acceptedLocales.length; i++) {
            if (detectedLocale.includes(this.acceptedLocales[i])) {
                return this.acceptedLocales[i];
            }
        }

        return "en";
    }

    setLocale(locale: Locale): void {
        const newLocale = this.acceptedLocales.includes(locale) ? locale : "en";
        if (newLocale !== this.locale) {
            if (this.translations[locale] === undefined) {
                // TODO: Complete & merge translation files.
                downloadFile(`/l10n/stats/${locale}.json`, (err, data) => {
                    if (err) {
                        console.error(
                            `Failed loading translation data for locale ${locale}`,
                        );
                        return;
                    }

                    this.translations[locale] = data!;
                    this.setLocale(locale);
                });
            } else this.locale = newLocale;
        }
    }

    getLocale(): Locale {
        return this.locale;
    }

    translate(key: string): string {
        const translation = this.translations[this.locale][key];
        if (!translation) console.warn(`Missing translation for key "${key}"!`);

        return translation || this.translations.en[key] || "";
    }
}
