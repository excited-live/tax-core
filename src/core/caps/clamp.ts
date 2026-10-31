import { validateMonetaryAmount } from "../money"
import { resolveCap } from "./resolve"
import type { ClampedAmount, StatutoryCapOptions } from "./types"

/**
 * Clamps a requested deduction, allowance, or expense against a statutory cap.
 *
 * @param requested Original requested amount.
 * @param capOrOptions Numeric cap or StatutoryCapOptions specification.
 * @param field Diagnostic field name.
 * @returns Breakdown-ready ClampedAmount structure.
 * @throws {TaxValidationError} if inputs are negative, NaN, or non-finite.
 * @example clampCap(150_000, 100_000, "allowance") // { requested: 150000, allowed: 100000, cap: 100000, wasClamped: true }
 */
export function clampCap(
	requested: number,
	capOrOptions: number | StatutoryCapOptions,
	field = "amount",
): ClampedAmount {
	validateMonetaryAmount(requested, field)

	const cap = typeof capOrOptions === "number" ? capOrOptions : resolveCap(capOrOptions, field)

	validateMonetaryAmount(cap, `${field}Cap`)

	const wasClamped = requested > cap
	const allowed = wasClamped ? cap : requested

	return {
		requested,
		allowed,
		cap,
		wasClamped,
	}
}
