import { applyPercentage, validateMonetaryAmount, validateRate } from "../money"
import type { StatutoryCapOptions } from "./types"

/**
 * Resolves a statutory cap limit from a formula configuration (percentage, ceiling, or min of both).
 *
 * @param options Statutory cap options specifying base, rate, and/or ceiling.
 * @param defaultField Default diagnostic field name.
 * @returns Resolved cap numerical ceiling.
 * @throws {TaxValidationError} if inputs are invalid.
 */
export function resolveCap(options: StatutoryCapOptions, defaultField = "cap"): number {
	const fieldName = options.field ?? defaultField
	const { base, rate, ceiling } = options

	let computedCap = Number.POSITIVE_INFINITY

	if (base !== undefined && rate !== undefined) {
		validateMonetaryAmount(base, `${fieldName}Base`)
		validateRate(rate, `${fieldName}Rate`)
		computedCap = applyPercentage(base, rate)
	}

	if (ceiling !== undefined) {
		validateMonetaryAmount(ceiling, `${fieldName}Ceiling`)
		computedCap = Math.min(computedCap, ceiling)
	}

	validateMonetaryAmount(computedCap, `${fieldName}Cap`)
	return computedCap
}
