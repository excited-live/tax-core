import {
	type BracketEvaluationResult,
	evaluateBrackets,
	type TaxBracket,
} from "../../core/brackets"
import { fromMinorUnits, toMinorUnits } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import { ThBracketField } from "../types"

/**
 * Evaluates an arbitrary Thai statutory bracket schedule (major-unit bounds) in minor units.
 *
 * Math: Converts bounds and incomes to satang, slices through `evaluateBrackets`, converts back.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError if incomes are negative or non-finite.
 *
 * @statute Thailand Revenue Code Sections 48(1), 48(4), 48(5).
 */
export function evaluateThBracketSet(
	taxableIncome: number,
	grossIncome: number,
	brackets: readonly TaxBracket[],
): {
	totalTax: number
	brackets: BracketEvaluationResult
} {
	const currency = TH_2026_PARAMETERS.currency
	const minorBrackets = brackets.map((b) => ({
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

/**
 * Evaluates the regular progressive tax brackets for Thailand PIT.
 *
 * Math: Slices taxable income through `TH_2026_PARAMETERS.brackets`.
 * Units: THB major units.
 * Throws: TaxValidationError if incomes are negative or non-finite.
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
	return evaluateThBracketSet(taxableIncome, grossIncome, TH_2026_PARAMETERS.brackets)
}
