import { TaxValidationError } from "./errors"

/**
 * Options controlling monetary validation.
 */
export interface ValidateAmountOptions {
	/** If true, negative values will not throw an error (e.g. net payable after refundable credits). */
	readonly allowNegative?: boolean
}

/**
 * Validates a monetary input against numerical boundaries (NaN, Infinity, negative).
 *
 * @param value Number to validate.
 * @param field Diagnostic field name for error reporting.
 * @param options Validation options.
 * @throws {TaxValidationError} if value is NaN, non-finite, or negative without allowNegative.
 */
export function validateMonetaryAmount(
	value: number,
	field: string,
	options?: ValidateAmountOptions,
): void {
	if (Number.isNaN(value)) {
		throw new TaxValidationError(field, value, "Value cannot be NaN")
	}
	if (!Number.isFinite(value)) {
		throw new TaxValidationError(field, value, "Value must be a finite number")
	}
	if (!options?.allowNegative && value < 0) {
		throw new TaxValidationError(field, value, "Value cannot be negative")
	}
}

/**
 * Validates a statutory percentage rate (e.g. 0.05 for 5%).
 *
 * @param rate Rate ratio between 0 and 1.
 * @param field Diagnostic field name.
 * @throws {TaxValidationError} if rate is NaN, non-finite, or outside [0, 1].
 */
export function validateRate(rate: number, field: string): void {
	if (Number.isNaN(rate) || !Number.isFinite(rate)) {
		throw new TaxValidationError(field, rate, "Rate must be a finite number")
	}
	if (rate < 0 || rate > 1) {
		throw new TaxValidationError(
			field,
			rate,
			"Statutory rate ratio must be between 0 and 1 (inclusive)",
		)
	}
}

/**
 * Validates that an amount is an exact integer minor unit.
 *
 * @param minorUnits Integer minor units.
 * @param field Diagnostic field name.
 * @param options Validation options.
 * @throws {TaxValidationError} if not a safe integer.
 */
export function validateIntegerMinorUnits(
	minorUnits: number,
	field: string,
	options?: ValidateAmountOptions,
): void {
	validateMonetaryAmount(minorUnits, field, options)
	if (!Number.isSafeInteger(minorUnits)) {
		throw new TaxValidationError(field, minorUnits, "Minor units amount must be a safe integer")
	}
}

/**
 * Validates a statutory count (children, years of service, holding years).
 *
 * Purpose: Guards integer counts that later multiply money, rejecting fractions and unsafe values.
 * Math: Requires `Number.isSafeInteger(value)` and `value >= min`.
 * Units: Dimensionless count (not currency).
 * Throws: TaxValidationError if value is not a safe integer or is below `min`.
 *
 * @param value Count to validate.
 * @param field Diagnostic field name.
 * @param min Inclusive lower bound (defaults to 0).
 * @statute Jurisdiction-neutral input bound (AGENTS rule 8); no statutory citation.
 */
export function validateSafeIntegerCount(value: number, field: string, min = 0): void {
	if (!Number.isSafeInteger(value)) {
		throw new TaxValidationError(field, value, "Count must be a safe integer")
	}
	if (value < min) {
		throw new TaxValidationError(field, value, `Count must be at least ${min}`)
	}
}

/**
 * Multiplies two integers and fails loudly if the product leaves the safe integer range.
 *
 * Purpose: Prevents silent precision loss when scaling minor units by a count (years, days).
 * Math: `a * b`, requiring `Number.isSafeInteger(a * b)`.
 * Units: Typically integer minor units times a dimensionless count; result in minor units.
 * Throws: TaxValidationError (reported against `field`) if the product is not a safe integer.
 *
 * @param a Integer factor (e.g. minor units).
 * @param b Integer factor (e.g. a validated count).
 * @param field Diagnostic field name of the count or amount being scaled.
 * @statute Jurisdiction-neutral input bound (AGENTS rule 8); no statutory citation.
 */
export function multiplySafeInteger(a: number, b: number, field: string): number {
	const product = a * b
	if (!Number.isSafeInteger(product)) {
		throw new TaxValidationError(field, b, "Scaled amount exceeds the safe integer range")
	}
	return product + 0
}
