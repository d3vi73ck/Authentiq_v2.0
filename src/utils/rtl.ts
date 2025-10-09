/**
 * RTL (Right-to-Left) language detection utilities
 * 
 * This module provides functions to detect RTL languages and manage
 * text direction for internationalization support.
 */

/**
 * List of RTL (Right-to-Left) language codes
 * Arabic is the primary RTL language we're supporting
 */
export const RTL_LANGUAGES = new Set(['ar']);

/**
 * Check if a given locale is an RTL (Right-to-Left) language
 * @param locale - The locale code to check (e.g., 'ar', 'en', 'fr')
 * @returns boolean - True if the locale is RTL, false otherwise
 */
export function isRtlLanguage(locale: string): boolean {
  return RTL_LANGUAGES.has(locale);
}

/**
 * Get the text direction for a given locale
 * @param locale - The locale code to check
 * @returns 'rtl' | 'ltr' - The text direction for the locale
 */
export function getTextDirection(locale: string): 'rtl' | 'ltr' {
  return isRtlLanguage(locale) ? 'rtl' : 'ltr';
}

/**
 * Get the HTML dir attribute value for a given locale
 * @param locale - The locale code to check
 * @returns 'rtl' | 'ltr' - The dir attribute value
 */
export function getHtmlDir(locale: string): 'rtl' | 'ltr' {
  return getTextDirection(locale);
}

/**
 * Check if the current locale requires RTL layout adjustments
 * @param locale - The locale code to check
 * @returns boolean - True if RTL layout adjustments are needed
 */
export function requiresRtlLayout(locale: string): boolean {
  return isRtlLanguage(locale);
}