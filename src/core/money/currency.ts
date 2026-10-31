/**
 * Standard ISO 4217 currency identifiers supported natively by the tax engine.
 */
export type StandardCurrencyCode = "THB" | "USD" | "JPY" | "KWD" | "EUR" | "GBP"

/**
 * Currency code: allows standard ISO codes with autocomplete or arbitrary currency string tags.
 */
export type CurrencyCode = StandardCurrencyCode | (string & {})

/**
 * Currency metadata defining minor unit precision and naming.
 */
export interface CurrencyInfo {
	readonly code: CurrencyCode
	readonly precision: number
	readonly minorUnitName?: string
}

/**
 * ISO 4217 Currency Precision Table.
 * Maps currency symbols to standard decimal places and minor unit denominations.
 */
export const CURRENCIES: Record<StandardCurrencyCode, CurrencyInfo> = {
	THB: { code: "THB", precision: 2, minorUnitName: "satang" },
	USD: { code: "USD", precision: 2, minorUnitName: "cent" },
	JPY: { code: "JPY", precision: 0, minorUnitName: "yen" },
	KWD: { code: "KWD", precision: 3, minorUnitName: "fils" },
	EUR: { code: "EUR", precision: 2, minorUnitName: "cent" },
	GBP: { code: "GBP", precision: 2, minorUnitName: "penny" },
}

/**
 * Retrieves the decimal precision (number of fractional digits) for a given currency code.
 *
 * @param currency ISO 4217 currency code.
 * @returns Number of fractional decimal digits (defaults to 2 for unknown currencies).
 * @example getCurrencyPrecision("THB") // 2 (1 THB = 100 Satang)
 */
export function getCurrencyPrecision(currency: CurrencyCode): number {
	if (Object.hasOwn(CURRENCIES, currency)) {
		return CURRENCIES[currency as StandardCurrencyCode].precision
	}
	return 2
}
