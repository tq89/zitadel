import { matchLanguage } from "@/lib/i18n";

/**
 * Authentication utility functions that don't require server actions
 */

/**
 * Check if a language code is valid (supported by the login UI)
 */
export function isValidLanguage(code: string): boolean {
  return matchLanguage(code) !== null;
}

/**
 * Extract a valid language code from uiLocales array.
 * Returns the canonical code of the first valid entry (e.g. "de" for "de-CH",
 * "zh-TW" for "zh-Hant-TW", "zh" for "zh-Hans-CN"), or null if none found.
 *
 * vnpccc fork: regional variants are resolved through matchLanguage so that
 * Traditional Chinese keeps its own locale instead of collapsing into "zh".
 */
export function getValidLocaleFromUILocales(uiLocales: string[] | undefined): string | null {
  if (!uiLocales || uiLocales.length === 0) {
    return null;
  }

  for (const locale of uiLocales) {
    const match = matchLanguage(locale);
    if (match) {
      return match;
    }
  }

  return null;
}

/**
 * Validate authentication request parameters
 */
export function validateAuthRequest(searchParams: URLSearchParams): string | null {
  const oidcRequestId = searchParams.get("authRequest");
  const samlRequestId = searchParams.get("samlRequest");

  const requestId =
    searchParams.get("requestId") ??
    (oidcRequestId ? `oidc_${oidcRequestId}` : samlRequestId ? `saml_${samlRequestId}` : undefined);

  return requestId || null;
}

/**
 * Check if request is an RSC request
 */
export function isRSCRequest(searchParams: URLSearchParams): boolean {
  return searchParams.has("_rsc");
}
