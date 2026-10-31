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
	field = "taxableAmount",
): BracketEvaluationResult {
	validateMonetaryAmount(taxableAmount, field)

	let totalTax = 0
	let lowerBound = 0
	const slices: BracketSlice[] = []

	for (let i = 0; i < brackets.length; i++) {
		const bracket = brackets[i]
		if (!bracket) continue

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

		if (upperBound === null || !Number.isFinite(upperBound)) {
			break
		}
		lowerBound = upperBound
	}

	const nextUnit = taxableAmount + 1
	let marginalRate = 0
	if (brackets.length > 0) {
		const lastBracket = brackets[brackets.length - 1]
		marginalRate = lastBracket ? lastBracket.rate : 0

		let currentLower = 0
		for (const bracket of brackets) {
			const currentUpper = bracket.upTo
			if (
				nextUnit > currentLower &&
				(currentUpper === null || !Number.isFinite(currentUpper) || nextUnit <= currentUpper)
			) {
				marginalRate = bracket.rate
				break
			}
			if (currentUpper !== null && Number.isFinite(currentUpper)) {
				currentLower = currentUpper
			}
		}
	}

	const effectiveRate = taxableAmount > 0 ? totalTax / taxableAmount : 0

	return {
		totalTax,
		slices,
		effectiveRate,
		marginalRate,
	}
}
