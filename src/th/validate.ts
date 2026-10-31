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
