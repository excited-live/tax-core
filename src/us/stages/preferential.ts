import type { TaxBracket } from "../../core/brackets"
import { applyPercentage, fromMinorUnits, type Money, usd } from "../../core/money"
import type { UsPreferentialSlice } from "../types"

export interface UsPreferentialStageResult {
	readonly preferentialTaxCents: number
	readonly preferentialTax: Money<"USD">
	readonly slices: readonly UsPreferentialSlice[]
}

function computePreferentialTier(
	tier: number,
	bracket: TaxBracket,
	tierLower: number,
	ordinaryTaxableCents: number,
	taxableIncomeCents: number,
): { slice: UsPreferentialSlice; taxCents: number; tierUpper: number } {
	const tierUpper = bracket.upTo ?? Number.POSITIVE_INFINITY
	const overlapStart = Math.max(ordinaryTaxableCents, tierLower)
	const overlapEnd = Math.min(taxableIncomeCents, tierUpper)
	const taxableInTier = Math.max(0, overlapEnd - overlapStart)
	const taxCents = taxableInTier > 0 ? applyPercentage(taxableInTier, bracket.rate) : 0

	return {
		slice: {
			tier,
			rate: bracket.rate,
			taxableAmount: usd(fromMinorUnits(taxableInTier, "USD")),
			tax: usd(fromMinorUnits(taxCents, "USD")),
		},
		taxCents,
		tierUpper,
	}
}

/**
 * Evaluates preferential stacking for Long-Term Capital Gains and Qualified Dividends.
 *
 * @statute IRC § 1(h)
 */
export function calculateUsPreferentialStacking(
	ordinaryTaxableCents: number,
	taxableIncomeCents: number,
	brackets: readonly TaxBracket[],
): UsPreferentialStageResult {
	let totalTaxCents = 0
	let tierLower = 0
	const slices: UsPreferentialSlice[] = []

	for (let i = 0; i < brackets.length; i++) {
		const bracket = brackets[i]
		if (!bracket) continue
		const result = computePreferentialTier(
			i,
			bracket,
			tierLower,
			ordinaryTaxableCents,
			taxableIncomeCents,
		)
		slices.push(result.slice)
		totalTaxCents += result.taxCents
		if (bracket.upTo === null) break
		tierLower = result.tierUpper
	}

	return {
		preferentialTaxCents: totalTaxCents,
		preferentialTax: usd(fromMinorUnits(totalTaxCents, "USD")),
		slices,
	}
}
