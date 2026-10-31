import { type CurrencyCode, getCurrencyPrecision } from "./currency"
import { TaxValidationError } from "./errors"
import { validateIntegerMinorUnits, validateMonetaryAmount } from "./validate"

function scaleDecimalString(abs: number, precision: number): number {
	const factor = 10 ** precision
	if (String(abs).includes("e")) {
		return abs * factor
	}
	const parts = String(abs).split(".")
	const intPart = parts[0] ?? "0"
	const decPart = (parts[1] ?? "").padEnd(precision, "0")
	const whole = intPart + decPart.slice(0, precision)
	const fraction = decPart.slice(precision)
	return Number(whole + (fraction.length > 0 ? `.${fraction}` : ""))
}

/**
 * Converts a major-unit monetary amount to integer minor units (satang/cent).
 *
 * Math: Decimal string expansion and half-away-from-zero rounding to eliminate IEEE 754 float drift.
 * Units: Input is major currency unit (e.g. THB, USD); output is integer minor units (e.g. Satang, Cents).
 *
 * @param amount Amount in major units.
 * @param currency ISO 4217 currency code.
 * @param field Diagnostic field name.
 * @returns Integer minor units.
 * @throws {TaxValidationError} if amount is NaN, infinite, or results in a non-safe integer.
 * @example toMinorUnits(1.14, "USD") // 114 (114 cents)
 */
export function toMinorUnits(amount: number, currency: CurrencyCode, field = "amount"): number {
	validateMonetaryAmount(amount, field)
	const precision = getCurrencyPrecision(currency)
	if (precision === 0) {
		const rounded = Math.round(amount) + 0
		if (!Number.isSafeInteger(rounded)) {
			throw new TaxValidationError(
				field,
				amount,
				"Conversion to minor units failed or exceeded safe integer bounds",
			)
		}
		return rounded
	}

	const sign = amount < 0 ? -1 : 1
	const abs = Math.abs(amount)
	const scaled = scaleDecimalString(abs, precision)
	const result = sign * Math.round(scaled) + 0
	if (!Number.isSafeInteger(result)) {
		throw new TaxValidationError(
			field,
			amount,
			"Conversion to minor units failed or exceeded safe integer bounds",
		)
	}
	return result
}

/**
 * Converts an integer minor unit amount back to major currency units.
 *
 * @param minorUnits Integer minor units.
 * @param currency ISO 4217 currency code.
 * @param field Diagnostic field name.
 * @returns Amount in major units.
 * @throws {TaxValidationError} if minorUnits is not a safe integer.
 * @example fromMinorUnits(1055, "THB") // 10.55
 */
export function fromMinorUnits(
	minorUnits: number,
	currency: CurrencyCode,
	field = "minorUnits",
): number {
	validateIntegerMinorUnits(minorUnits, field)
	const precision = getCurrencyPrecision(currency)
	if (precision === 0) {
		return minorUnits + 0
	}
	const factor = 10 ** precision
	const sign = minorUnits < 0 ? -1 : 1
	const absUnits = Math.abs(minorUnits)
	return sign * Number((absUnits / factor).toFixed(precision)) + 0
}
