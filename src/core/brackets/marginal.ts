import type { TaxBracket } from "./types"

/**
 * Determines the marginal tax rate that applies to the next unit of ordinary income.
 *
 * @param brackets Ordered progressive tax brackets.
 * @param nextUnit Amount of income on the boundary transition (taxableAmount + 1).
 * @returns Marginal statutory rate ratio.
 */
export function marginalRateAt(brackets: readonly TaxBracket[], nextUnit: number): number {
	let lower = 0
	for (const bracket of brackets) {
		const upper = bracket.upTo
		if (nextUnit > lower && (upper === null || !Number.isFinite(upper) || nextUnit <= upper)) {
			return bracket.rate
		}
		if (upper === null || !Number.isFinite(upper)) {
			break
		}
		lower = upper
	}
	return brackets[0]?.rate ?? 0
}
