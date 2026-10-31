import { applyPercentage } from "../money"
import type { BracketSlice, TaxBracket } from "./types"

/**
 * Computes progressive tax and slice boundaries for a single bracket tier.
 *
 * @param lowerBound Lower threshold in minor units.
 * @param bracket Current bracket specification.
 * @param taxableAmount Total taxable income in minor units.
 * @param index Bracket index.
 * @returns Computed BracketSlice.
 */
export function computeBracketSlice(
	lowerBound: number,
	bracket: TaxBracket,
	taxableAmount: number,
	index: number,
): BracketSlice {
	const upperBound = bracket.upTo
	let sliceTaxable = 0

	if (taxableAmount > lowerBound) {
		if (upperBound === null || !Number.isFinite(upperBound)) {
			sliceTaxable = taxableAmount - lowerBound
		} else {
			sliceTaxable = Math.min(taxableAmount, upperBound) - lowerBound
		}
	}

	const sliceTax = applyPercentage(sliceTaxable, bracket.rate)

	return {
		bracketIndex: index,
		lowerBound,
		upperBound,
		rate: bracket.rate,
		taxableAmount: sliceTaxable,
		tax: sliceTax,
	}
}
