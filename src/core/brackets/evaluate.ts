import { TaxValidationError, validateMonetaryAmount, validateRate } from "../money"
import { marginalRateAt } from "./marginal"
import { computeBracketSlice } from "./slice"
import type { BracketEvaluationResult, BracketSlice, TaxBracket } from "./types"

function validateSingleBracket(
	bracket: TaxBracket,
	index: number,
	isLast: boolean,
	prevBound: number,
): number {
	validateRate(bracket.rate, `bracket[${index}].rate`)
	if (bracket.upTo === null) {
		if (!isLast) {
			throw new TaxValidationError(
				`bracket[${index}].upTo`,
				bracket.upTo,
				"Only the final bracket tier may have upTo: null (unbounded)",
			)
		}
		return prevBound
	}
	validateMonetaryAmount(bracket.upTo, `bracket[${index}].upTo`)
	if (!Number.isSafeInteger(bracket.upTo) || bracket.upTo <= prevBound) {
		throw new TaxValidationError(
			`bracket[${index}].upTo`,
			bracket.upTo,
			`Bracket bound must be a safe integer greater than ${prevBound}`,
		)
	}
	return bracket.upTo
}

function validateBrackets(brackets: readonly TaxBracket[]): void {
	if (brackets.length === 0) {
		throw new TaxValidationError("brackets", brackets, "Bracket list cannot be empty")
	}
	let prevBound = 0
	for (let i = 0; i < brackets.length; i++) {
		const bracket = brackets[i]
		if (!bracket) continue
		prevBound = validateSingleBracket(bracket, i, i === brackets.length - 1, prevBound)
	}
	const last = brackets[brackets.length - 1]
	if (last && last.upTo !== null) {
		throw new TaxValidationError("brackets", brackets, "Final bracket tier must have upTo: null")
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
