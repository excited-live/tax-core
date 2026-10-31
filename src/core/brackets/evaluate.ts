import { validateMonetaryAmount, validateRate } from "../money"
import { marginalRateAt } from "./marginal"
import { computeBracketSlice } from "./slice"
import type { BracketEvaluationResult, BracketSlice, TaxBracket } from "./types"

/**
 * Validates ordered progressive tax brackets.
 */
function validateBrackets(brackets: readonly TaxBracket[]): void {
	for (let i = 0; i < brackets.length; i++) {
		const bracket = brackets[i]
		if (!bracket) continue
		validateRate(bracket.rate, `bracket[${i}].rate`)
		if (bracket.upTo !== null) {
			validateMonetaryAmount(bracket.upTo, `bracket[${i}].upTo`)
		}
	}
}

/**
 * Evaluates progressive tax brackets slice-by-slice across multiple tiers.
 *
 * Math: Slices taxable income across progressive tiers and sums integer tax per slice.
 * Units: All inputs and outputs must be integer minor units (satang/cents).
 *
 * @param taxableAmount Taxable income in integer minor units.
 * @param brackets Ordered progressive statutory tax brackets.
 * @param grossIncome Optional gross income in minor units for statutory effective rate calculation.
 * @param field Diagnostic field name.
 * @returns Evaluated bracket result including total tax, slices, effective rate, and marginal rate.
 * @throws {TaxValidationError} if inputs are invalid.
 */
export function evaluateBrackets(
	taxableAmount: number,
	brackets: readonly TaxBracket[],
	grossIncome?: number,
	field = "taxableAmount",
): BracketEvaluationResult {
	validateMonetaryAmount(taxableAmount, field)
	if (grossIncome !== undefined) {
		validateMonetaryAmount(grossIncome, "grossIncome")
	}
	validateBrackets(brackets)

	let totalTax = 0
	let lowerBound = 0
	const slices: BracketSlice[] = []

	for (let i = 0; i < brackets.length; i++) {
		const bracket = brackets[i]
		if (!bracket) continue

		const slice = computeBracketSlice(lowerBound, bracket, taxableAmount, i)
		slices.push(slice)
		totalTax += slice.tax

		if (bracket.upTo === null || !Number.isFinite(bracket.upTo)) {
			break
		}
		lowerBound = bracket.upTo
	}

	const baseForEffective = grossIncome ?? taxableAmount
	const effectiveRate = baseForEffective > 0 ? totalTax / baseForEffective : 0
	const marginalRate = marginalRateAt(brackets, taxableAmount + 1)

	return {
		totalTax,
		slices,
		effectiveRate,
		marginalRate,
	}
}
