import { TaxValidationError } from "../core/money"
import { ThSpecialRegimeField } from "./types"

/**
 * Validates a Thai corporate income tax rate used for the Section 47 bis gross-up.
 *
 * Purpose: Keeps `rate / (1 - rate)` finite before any stage uses the rate.
 * Math: Requires `0 <= rate < 1`.
 * Units: Rate ratio (0.2 = 20%).
 * Throws: TaxValidationError if rate is NaN, non-finite, negative, or at least 1.
 *
 * @param rate Corporate income tax rate ratio.
 * @statute Thailand Revenue Code Section 47 bis.
 */
export function validateCorpTaxRate(rate: number): void {
	if (!Number.isFinite(rate) || rate < 0 || rate >= 1) {
		throw new TaxValidationError(
			ThSpecialRegimeField.CorpTaxRate,
			rate,
			"Corporate tax rate must be finite and satisfy 0 <= rate < 1",
		)
	}
}

/**
 * Resolves an optional typed choice (election, payment type, acquisition type) at runtime.
 *
 * Purpose: TypeScript unions are erased at runtime, so untyped callers could otherwise pass an
 * unknown string and silently get the default behaviour.
 * Math: Returns `fallback` when `value` is `undefined`; otherwise requires membership in `choices`.
 * Units: Dimensionless string enum.
 * Throws: TaxValidationError (reported against `field`) if `value` is not one of `choices`.
 *
 * @param value Caller-supplied value, possibly outside the declared union.
 * @param choices Typed const object whose values are the permitted choices.
 * @param fallback Choice used when `value` is `undefined`.
 * @param field Diagnostic field path reported on failure.
 * @statute Jurisdiction-neutral input bound (AGENTS rule 8); no statutory citation.
 */
export function resolveChoice<T extends string>(
	value: string | undefined,
	choices: Readonly<Record<string, T>>,
	fallback: T,
	field: ThSpecialRegimeField,
): T {
	if (value === undefined) return fallback
	const match = Object.values(choices).find((choice) => choice === value)
	if (match === undefined) {
		throw new TaxValidationError(field, value, "Value is not a supported choice")
	}
	return match
}
