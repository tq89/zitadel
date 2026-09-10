export interface Lang {
  name: string;
  code: string;
}

export const LANGS: Lang[] = [
  {
    name: "English",
    code: "en",
  },
  {
    name: "Deutsch",
    code: "de",
  },
  {
    name: "Italiano",
    code: "it",
  },
  {
    name: "Español",
    code: "es",
  },
  {
    name: "Français",
    code: "fr",
  },
  {
    name: "Nederlands",
    code: "nl",
  },
  {
    name: "Polski",
    code: "pl",
  },
  {
    name: "Português",
    code: "pt",
  },
  {
    name: "简体中文",
    code: "zh",
  },
  // vnpccc fork: Traditional Chinese (Taiwan wording) and Vietnamese are not
  // shipped upstream. "zh" stays Simplified; "zh-TW" is its own locale so
  // Taiwanese users never get machine-converted Simplified text.
  {
    name: "繁體中文",
    code: "zh-TW",
  },
  {
    name: "Tiếng Việt",
    code: "vi",
  },
  {
    name: "Русский",
    code: "ru",
  },
  {
    name: "Magyar",
    code: "hu",
  },
  {
    name: "Türkçe",
    code: "tr",
  },
  {
    name: "日本語",
    code: "ja",
  },
  {
    name: "Українська",
    code: "uk",
  },
  {
    name: "العربية",
    code: "ar",
  },
];

export const LANGUAGE_COOKIE_NAME = "NEXT_LOCALE";
export const LANGUAGE_HEADER_NAME = "accept-language";

export function shouldUILocalesOverrideCookie(): boolean {
  return process.env.ZITADEL_UI_LOCALES_OVERRIDE_COOKIE === "true";
}

// vnpccc fork: regional/script tags that must map onto one of our locales.
// Browsers send "zh-TW" / "zh-Hant" for Traditional and "zh-CN" / "zh-Hans"
// for Simplified — upstream stripped everything after the first "-", which
// silently turned every Traditional Chinese user into Simplified.
const REGION_ALIASES: Record<string, string> = {
  "zh-tw": "zh-TW",
  "zh-hk": "zh-TW",
  "zh-mo": "zh-TW",
  "zh-hant": "zh-TW",
  "zh-hant-tw": "zh-TW",
  "zh-hant-hk": "zh-TW",
  "zh-cn": "zh",
  "zh-sg": "zh",
  "zh-hans": "zh",
  "zh-hans-cn": "zh",
};

/**
 * Resolve a language tag ("vi-VN", "zh-Hant", "EN", "zh-TW") to the canonical
 * code of an allowed language, or null. Tries the full tag (after alias
 * mapping) first, then the base language. Comparison is case-insensitive so
 * cookies / ui_locales / restrictions written in any casing still match.
 */
export function matchLanguage(tag: string, allowed: string[] = LANGS.map((l) => l.code)): string | null {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  const byLower = new Map(allowed.map((code) => [code.toLowerCase(), code]));
  const candidates = [REGION_ALIASES[normalized] ?? normalized, normalized.split("-")[0]];
  for (const candidate of candidates) {
    const hit = byLower.get(candidate.toLowerCase());
    if (hit) {
      return hit;
    }
  }
  return null;
}

/**
 * Pick the locale from an Accept-Language header ("zh-TW,zh;q=0.9,en;q=0.8"):
 * walk the tags in the order the browser sent them and take the first that
 * resolves to an allowed language.
 */
export function resolveLocaleFromHeader(header: string, allowed: string[]): string | null {
  for (const part of header.split(",")) {
    const hit = matchLanguage(part.split(";")[0], allowed);
    if (hit) {
      return hit;
    }
  }
  return null;
}

export function getLanguage(code: string): Lang {
  const lang = LANGS.find((l) => l.code === code);
  if (lang) {
    return lang;
  }

  return {
    code,
    name: new Intl.DisplayNames([code], { type: "language" }).of(code) || code,
  };
}
