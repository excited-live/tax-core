import { fromMinorUnits, toMinorUnits } from "../core/money"
import { TH_2026_PARAMETERS } from "./parameters"

/**
 * Converts a THB major-unit amount to integer satang.
 *
 * Purpose: Single THB-bound entry point so stages never repeat the currency threading.
 * Math: Decimal-exact conversion via `toMinorUnits` (half away from zero beyond 2 decimals).
 * Units: THB major units in, integer satang out.
 * Throws: TaxValidationError if the amount is negative (unless allowed), non-finite, or unsafe.
 *
 * @param amount Amount in THB.
 * @param field Diagnostic field name reported on failure.
 * @statute Thailand Revenue Code Section 40 (amounts expressed in baht).
 */
export function toSatang(amount: number, field?: string): number {
	return toMinorUnits(amount, TH_2026_PARAMETERS.currency, field)
}

/**
 * Converts integer satang back to THB major units.
 *
 * Purpose: Counterpart of {@link toSatang}.
 * Math: `satang / 100`, fixed to two decimals.
 * Units: Integer satang in, THB major units out.
 * Throws: TaxValidationError if the input is not a safe integer (or is negative without
 * `allowNegative`).
 *
 * @param satang Integer satang.
 * @param field Diagnostic field name reported on failure.
 * @param options Set `allowNegative` for refund balances.
 * @statute Thailand Revenue Code Section 40 (amounts expressed in baht).
 */
export function fromSatang(
	satang: number,
	field?: string,
	options?: { readonly allowNegative?: boolean },
): number {
	return fromMinorUnits(satang, TH_2026_PARAMETERS.currency, field, options)
}

/**
 * Sums non-negative THB amounts exactly in integer satang.
 *
 * Purpose: Avoids binary float drift when aggregating gross amounts.
 * Math: Converts each amount to satang, adds, converts back to major units.
 * Units: THB major units in and out.
 * Throws: TaxValidationError if any amount is negative or non-finite.
 *
 * @param values Amounts in THB.
 * @param field Diagnostic field name reported on failure.
 * @statute Thailand Revenue Code Section 40 (gross income aggregation).
 */
export function sumThAmounts(values: readonly number[], field?: string): number {
	return fromSatang(values.reduce((sum, value) => sum + toSatang(value, field), 0))
}
