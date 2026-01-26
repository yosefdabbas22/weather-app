/**
 * Normalizes Arabic text for search purposes
 * Handles diacritics, different letter forms, and common variations
 */

/**
 * Removes Arabic diacritics (tashkeel) from text
 */
function removeDiacritics(text: string): string {
  // Arabic diacritics: Fatha, Damma, Kasra, Sukun, Shadda, Tanwin
  const diacritics = /[\u064B-\u065F\u0670]/g
  return text.replace(diacritics, '')
}

/**
 * Normalizes Arabic letter variations to standard forms
 */
function normalizeArabicLetters(text: string): string {
  return text
    .replace(/ى/g, 'ي') // Alif maksura (ى) to Ya (ي)
    .replace(/ة/g, 'ه') // Ta marbuta (ة) to Ha (ه) - for better matching
    .replace(/إ/g, 'ا') // Alif with hamza below (إ) to Alif (ا)
    .replace(/أ/g, 'ا') // Alif with hamza above (أ) to Alif (ا)
    .replace(/آ/g, 'ا') // Alif maddah (آ) to Alif (ا)
    .replace(/ؤ/g, 'و') // Waw with hamza (ؤ) to Waw (و)
    .replace(/ئ/g, 'ي') // Ya with hamza (ئ) to Ya (ي)
}

/**
 * Normalizes Arabic text for search
 * - Removes diacritics
 * - Normalizes letter variations
 * - Trims whitespace
 * - Preserves the original text structure
 */
export function normalizeArabic(text: string): string {
  if (!text || typeof text !== 'string') {
    return text
  }

  // Check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF]/.test(text)

  if (!hasArabic) {
    // For non-Arabic text, just normalize whitespace
    return text.trim().replace(/\s+/g, ' ')
  }

  // Normalize Arabic text
  let normalized = text.trim()
  normalized = removeDiacritics(normalized)
  normalized = normalizeArabicLetters(normalized)
  normalized = normalized.replace(/\s+/g, ' ') // Normalize whitespace

  return normalized
}

/**
 * Normalizes city/country name for search (handles both Arabic and English)
 */
export function normalizeCityName(city: string): string {
  if (!city || typeof city !== 'string') {
    return ''
  }

  // First normalize Arabic if present
  let normalized = normalizeArabic(city)

  // For English text, convert to lowercase
  // For Arabic text, keep as is (Arabic doesn't have case)
  const hasArabic = /[\u0600-\u06FF]/.test(normalized)
  if (!hasArabic) {
    normalized = normalized.toLowerCase()
  }

  return normalized.trim()
}
