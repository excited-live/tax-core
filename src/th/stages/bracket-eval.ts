import { type BracketEvaluationResult, evaluateBrackets } from "../../core/brackets"
import { fromMinorUnits, toMinorUnits } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import { ThBracketField } from "../types"

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
	const currency = TH_2026_PARAMETERS.currency
	const minorBrackets = TH_2026_PARAMETERS.brackets.map((b) => ({
		upTo: b.upTo === null ? null : toMinorUnits(b.upTo, currency),
		rate: b.rate,
	}))
	const taxableMinor = toMinorUnits(taxableIncome, currency, ThBracketField.TaxableIncome)
	const grossMinor = toMinorUnits(grossIncome, currency, ThBracketField.GrossIncome)
	const res = evaluateBrackets(taxableMinor, minorBrackets, grossMinor)

	const slices = res.slices.map((s) => ({
		bracketIndex: s.bracketIndex,
		lowerBound: fromMinorUnits(s.lowerBound, currency),
		upperBound: s.upperBound !== null ? fromMinorUnits(s.upperBound, currency) : null,
		rate: s.rate,
		taxableAmount: fromMinorUnits(s.taxableAmount, currency),
		tax: fromMinorUnits(s.tax, currency),
	}))

	const totalTax = fromMinorUnits(res.totalTax, currency)
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
