import $ from "jquery";
import { device } from "../device";
import english from "../en.json";

export function downloadFile(
    file: string,
    onComplete: (err: null | JQuery.jqXHR<any>, data?: Record<string, string>) => void,
) {
    const opts = {
        url: file,
        type: "GET",
    };
    $.ajax(opts)
        .done((data) => {
            onComplete(null, data);
        })
        .fail((err) => {
            onComplete(err);
        });
}

const Locales = {
    da: "Dansk",
    de: "Deutsch",
    en: "English",
    es: "Español",
    fr: "Français",
    it: "Italiano",
    nl: "Nederlands",
    pl: "Polski",
    pt: "Português",
    ru: "Русский",
    sv: "Svenska",
    vn: "Tiếng Việt",
    tr: "Türkçe",
    jp: "日本語",
    ko: "한국어",
    th: "ภาษาไทย",
    "zh-cn": "中文简体",
    "zh-tw": "中文繁體",
};

export type Locale = keyof typeof Locales;

export class Localization {
    constructor(
        public locale: Locale = "en",
        private readonly acceptedLocales: Locale[] = Object.keys(Locales) as Locale[],
        private translations: Record<string, Record<string, string>> = {
            en: english,
        },
        private readonly isStats = false,
    ) {}

    setLocale(locale: Locale) {
        const newLocale = this.acceptedLocales.includes(locale) ? locale : "en";
        if (newLocale != this.locale) {
            const downloadUrl = `/l10n/${this.isStats ? "stats/" : ""}${locale}.json`;
            if (this.translations[locale] === undefined) {
                downloadFile(downloadUrl, (err, data) => {
                    if (err) {
                        console.error(
                            `Failed loading translation data for locale ${locale}`,
                        );
                        return;
                    }
                    this.translations[locale] = data!;
                    this.setLocale(locale);
                });
            } else {
                this.locale = newLocale;
                this.localizeIndex();
            }
        }
    }

    getLocale() {
        return this.locale;
    }

    translate(key: string) {
        // Also try spaces as dashes
        const spacedKey = key.replace(" ", "-");
        return (
            this.translations[this.locale][key] ||
            this.translations[this.locale][spacedKey] ||
            this.translations["en"][key] ||
            ""
        );
    }

    localizeIndex() {
        // Go through index and replace data-l10n tagged elements
        const localizedElements = $("*[data-l10n]");
        localizedElements.each((_idx, el): any => {
            const el$ = $(el);
            let datal10n = el$.attr("data-l10n")!;
            if (el$.hasClass("help-control") && device.touch) {
                datal10n += "-touch";
            }
            let localizedText = this.translate(datal10n);
            if (localizedText) {
                if (el$.attr("data-caps") == "true") {
                    localizedText = localizedText.toUpperCase();
                }
                if (el$.attr("label")) {
                    el$.attr("label", localizedText);
                    return true;
                }
                if (el$.attr("placeholder")) {
                    el$.attr("placeholder", localizedText);
                    return true;
                }
                el$.html(localizedText);
                if (el$.attr("data-label")) {
                    el$.attr("data-label", localizedText);
                }
            }
        });
    }

    populateLanguageSelect() {
        if (this.isStats) return;
        const el = $(".language-select");
        el.empty();
        for (let i = 0; i < this.acceptedLocales.length; i++) {
            const locale = this.acceptedLocales[i];
            const name = Locales[locale];
            el.append(
                $("<option>", {
                    value: locale,
                    text: name,
                }),
            );
        }
    }
    detectLocale() {
        let detectedLocale = (navigator.language || navigator.userLanguage).toLowerCase();
        const languageWildcards = ["pt", "de", "es", "fr", "ko", "ru", "en"];
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
}
