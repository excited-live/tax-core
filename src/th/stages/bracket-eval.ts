import { type BracketEvaluationResult, evaluateBrackets } from "../../core/brackets"
import { fromMinorUnits, toMinorUnits } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"

/**
 * Evaluates progressive tax brackets for Thailand PIT.
 *
 * @statute Thailand Revenue Code Section 48(1).
 */
export function evaluateThBrackets(
	taxableIncome: number,
	grossIncome: number,
): {
	totalTax: number
	brackets: BracketEvaluationResult
} {
	const minorBrackets = TH_2026_PARAMETERS.brackets.map((b) => ({
		upTo: b.upTo === null ? null : toMinorUnits(b.upTo, "THB"),
		rate: b.rate,
	}))
	const taxableMinor = toMinorUnits(taxableIncome, "THB", "taxableIncome")
	const grossMinor = toMinorUnits(grossIncome, "THB", "grossIncome")
	const res = evaluateBrackets(taxableMinor, minorBrackets, grossMinor)

	const slices = res.slices.map((s) => ({
		bracketIndex: s.bracketIndex,
		lowerBound: fromMinorUnits(s.lowerBound, "THB"),
		upperBound: s.upperBound !== null ? fromMinorUnits(s.upperBound, "THB") : null,
		rate: s.rate,
		taxableAmount: fromMinorUnits(s.taxableAmount, "THB"),
		tax: fromMinorUnits(s.tax, "THB"),
	}))

	const totalTax = fromMinorUnits(res.totalTax, "THB")
	return {
		totalTax,
		brackets: {
			totalTax,
			slices,
			effectiveRate: res.effectiveRate,
			marginalRate: res.marginalRate,
		},
	}
}
