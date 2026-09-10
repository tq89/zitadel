import { describe, expect, it } from "vitest";
import { LANGS, matchLanguage, resolveLocaleFromHeader } from "./i18n";

// vnpccc fork: Vietnamese + Traditional Chinese locales and regional matching.
describe("vnpccc locales", () => {
  it("ships vi and zh-TW next to Simplified zh", () => {
    const codes = LANGS.map((l) => l.code);
    expect(codes).toContain("vi");
    expect(codes).toContain("zh-TW");
    expect(codes).toContain("zh");
  });
});

describe("matchLanguage", () => {
  it("keeps plain codes and is case-insensitive", () => {
    expect(matchLanguage("en")).toBe("en");
    expect(matchLanguage("VI")).toBe("vi");
    expect(matchLanguage("zh-tw")).toBe("zh-TW");
    expect(matchLanguage("ZH-TW")).toBe("zh-TW");
  });

  it("maps regional and script variants onto our locales", () => {
    expect(matchLanguage("vi-VN")).toBe("vi");
    expect(matchLanguage("zh-Hant")).toBe("zh-TW");
    expect(matchLanguage("zh-Hant-TW")).toBe("zh-TW");
    expect(matchLanguage("zh-HK")).toBe("zh-TW");
    expect(matchLanguage("zh-CN")).toBe("zh");
    expect(matchLanguage("zh-Hans-CN")).toBe("zh");
    expect(matchLanguage("de-CH")).toBe("de");
  });

  it("falls back to the base language when the variant is not allowed", () => {
    expect(matchLanguage("zh-TW", ["en", "zh"])).toBe("zh");
    expect(matchLanguage("zh-TW", ["en"])).toBeNull();
    expect(matchLanguage("xx")).toBeNull();
    expect(matchLanguage("")).toBeNull();
  });

  it("returns the canonical casing of the allowed list", () => {
    expect(matchLanguage("zh-TW", ["en", "zh-tw"])).toBe("zh-tw");
  });
});

describe("resolveLocaleFromHeader", () => {
  const allowed = LANGS.map((l) => l.code);

  it("does not collapse zh-TW into zh", () => {
    expect(resolveLocaleFromHeader("zh-TW,zh;q=0.9,en;q=0.8", allowed)).toBe("zh-TW");
  });

  it("walks the tags in browser order", () => {
    expect(resolveLocaleFromHeader("xx-XX,vi-VN;q=0.9,en;q=0.8", allowed)).toBe("vi");
    expect(resolveLocaleFromHeader("en-US,en;q=0.9", allowed)).toBe("en");
  });

  it("returns null when nothing matches", () => {
    expect(resolveLocaleFromHeader("xx,yy;q=0.5", allowed)).toBeNull();
  });
});

// vnpccc fork: prove next-intl finds every message in the new locales.
// Mirrors the merge in src/i18n/request.ts: en fallback → locale file → API.
describe("locale message files", () => {
  const flatten = (obj: Record<string, unknown>, prefix = ""): Record<string, string> =>
    Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object") {
        Object.assign(acc, flatten(v as Record<string, unknown>, key));
      } else {
        acc[key] = String(v);
      }
      return acc;
    }, {});

  const placeholders = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort().join(",");

  it.each(["vi", "zh-TW", "zh", "en"])("%s covers every key of en.json", async (locale) => {
    const en = flatten((await import(`../../locales/en.json`)).default);
    const messages = flatten((await import(`../../locales/${locale}.json`)).default);

    for (const key of Object.keys(en)) {
      expect(messages[key], `${locale}: thiếu khoá ${key}`).toBeTruthy();
      expect(placeholders(messages[key]), `${locale}: placeholder lệch ở ${key}`).toBe(placeholders(en[key]));
    }
  });

  it.each(["vi", "zh-TW"])("%s has no leftover English in visible labels", async (locale) => {
    const messages = flatten((await import(`../../locales/${locale}.json`)).default);
    // "Continue" là chuỗi lặp nhiều nhất — sót là thấy ngay
    expect(Object.values(messages)).not.toContain("Continue");
    expect(messages["loginname.submit"]).not.toBe("Continue");
  });
});
