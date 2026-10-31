import { applyPercentage, validateMonetaryAmount } from "./money"

export interface TaxBracket {
	readonly upTo: number | null
	readonly rate: number
}

export interface BracketSlice {
	readonly bracketIndex: number
	readonly lowerBound: number
	readonly upperBound: number | null
	readonly rate: number
	readonly taxableAmount: number
	readonly tax: number
}

export interface BracketEvaluationResult {
	readonly totalTax: number
	readonly slices: readonly BracketSlice[]
	readonly effectiveRate: number
	readonly marginalRate: number
}

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

	let totalTax = 0
	let lowerBound = 0
	const slices: BracketSlice[] = []
	const nextUnit = taxableAmount + 1
	let marginalRate = brackets[0]?.rate ?? 0

	for (let i = 0; i < brackets.length; i++) {
		const bracket = brackets[i]
		if (!bracket) continue

		validateMonetaryAmount(bracket.rate, `bracket[${i}].rate`)
		if (bracket.upTo !== null) {
			validateMonetaryAmount(bracket.upTo, `bracket[${i}].upTo`)
		}

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
		totalTax += sliceTax

		slices.push({
			bracketIndex: i,
			lowerBound,
			upperBound,
			rate: bracket.rate,
			taxableAmount: sliceTaxable,
			tax: sliceTax,
		})

		// Track marginal rate on next unit of ordinary income in the same traversal
		if (
			nextUnit > lowerBound &&
			(upperBound === null || !Number.isFinite(upperBound) || nextUnit <= upperBound)
		) {
			marginalRate = bracket.rate
		}

		if (upperBound === null || !Number.isFinite(upperBound)) {
			break
		}
		lowerBound = upperBound
	}

	const baseForEffectiveRate = grossIncome !== undefined ? grossIncome : taxableAmount
	const effectiveRate = baseForEffectiveRate > 0 ? totalTax / baseForEffectiveRate : 0

	return {
		totalTax,
		slices,
		effectiveRate,
		marginalRate,
	}
}
