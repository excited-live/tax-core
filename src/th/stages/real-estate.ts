import type { TaxBracket } from "../../core/brackets"
import {
	applyPercentage,
	multiplySafeInteger,
	roundHalfUp,
	validateMonetaryAmount,
	validateSafeIntegerCount,
} from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	type ThRealEstateBreakdown,
	type ThRealEstateTransferInput,
	ThSpecialRegimeField,
} from "../types"
import { fromSatang, toSatang } from "../units"
import { evaluateThBracketSet, evaluateThBrackets } from "./bracket-eval"

const EMPTY_BREAKDOWN: ThRealEstateBreakdown = {
	grossTransferValue: 0,
	holdingYears: 0,
	expenseRate: 0,
	expense: 0,
	netGain: 0,
	annualGain: 0,
	brackets: evaluateThBrackets(0, 0).brackets,
	annualTax: 0,
	taxBeforeCap: 0,
	taxCap: 0,
	wasClamped: false,
	tax: 0,
}

function expenseRateFor(holdingYears: number): number {
	const table = TH_2026_PARAMETERS.realEstate.expenseTable
	return table.reduce((rate, row) => (holdingYears >= row.minYears ? row.rate : rate), 0)
}

/**
 * Scales every finite regular bracket bound by the holding period.
 *
 * Math: `years * tax(net / years)` equals the tax on `net` against bounds multiplied by `years`
 * (each slice `rate * clip(net/years - lo, 0, width) * years = rate * clip(net - lo*years, 0, width*years)`),
 * so the annualisation needs no intermediate rounding.
 * Units: THB major units; scaling performed in integer satang.
 * Throws: TaxValidationError if a scaled bound exceeds the safe integer range.
 */
function scaleBracketsByYears(years: number): readonly TaxBracket[] {
	return TH_2026_PARAMETERS.brackets.map((bracket) => {
		if (bracket.upTo === null) return bracket
		const scaled = multiplySafeInteger(
			toSatang(bracket.upTo),
			years,
			ThSpecialRegimeField.RealEstateHoldingYears,
		)
		return { upTo: fromSatang(scaled), rate: bracket.rate }
	})
}

/**
 * Clamps real estate tax at the statutory share of the gross transfer value.
 *
 * Purpose: Applies the Section 48(4) ceiling on the separately computed tax.
 * Math: taxCap = grossMinor * `realEstate.taxCapRate` (20%, half-up); tax = min(taxBeforeCap, taxCap).
 * Units: Integer minor units (satang) in and out.
 * Throws: TaxValidationError if `grossMinor` is not a non-negative safe integer.
 *
 * @param taxBeforeCap Uncapped tax in satang.
 * @param grossMinor Gross transfer value in satang.
 * @statute Thailand Revenue Code Section 48(4).
 */
export function applyRealEstateCap(
	taxBeforeCap: number,
	grossMinor: number,
): { taxCap: number; tax: number; wasClamped: boolean } {
	const taxCap = applyPercentage(grossMinor, TH_2026_PARAMETERS.realEstate.taxCapRate)
	return { taxCap, tax: Math.min(taxBeforeCap, taxCap), wasClamped: taxBeforeCap > taxCap }
}

/**
 * Calculates Section 48(4) tax on an inherited, gifted, or sold real estate transfer.
 *
 * Purpose: Taxes the gain as if earned evenly over the holding period, then scales back up.
 * Math: net gain = gross - gross * expenseRate(holdingYears); tax = years * bracketTax(net / years),
 * evaluated exactly as bracketTax of `net` against bounds multiplied by `years` (no per-year
 * rounding); tax is clamped at 20% of gross. `annualGain` and `annualTax` are rounded for display.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError for a negative/non-finite value, a non-positive/non-safe-integer holding
 * period, or a holding period so long that scaled bracket bounds exceed the safe integer range.
 *
 * @statute Thailand Revenue Code Section 48(4), Section 42(5).
 */
export function calculateRealEstateTransfer(
	input: ThRealEstateTransferInput | undefined,
): ThRealEstateBreakdown {
	if (input === undefined) return EMPTY_BREAKDOWN
	validateMonetaryAmount(input.grossTransferValue, ThSpecialRegimeField.RealEstateGrossValue)
	validateSafeIntegerCount(input.holdingYears, ThSpecialRegimeField.RealEstateHoldingYears, 1)

	const years = input.holdingYears
	const expenseRate = expenseRateFor(years)
	const gross = toSatang(input.grossTransferValue, ThSpecialRegimeField.RealEstateGrossValue)
	const expense = applyPercentage(gross, expenseRate)
	const netGain = gross - expense
	const evaluated = evaluateThBracketSet(
		fromSatang(netGain),
		fromSatang(netGain),
		scaleBracketsByYears(years),
	)
	const taxBeforeCap = toSatang(evaluated.totalTax)
	const capped = applyRealEstateCap(taxBeforeCap, gross)
	return {
		grossTransferValue: input.grossTransferValue,
		holdingYears: years,
		expenseRate,
		expense: fromSatang(expense),
		netGain: fromSatang(netGain),
		annualGain: fromSatang(roundHalfUp(netGain / years)),
		brackets: evaluated.brackets,
		annualTax: fromSatang(roundHalfUp(taxBeforeCap / years)),
		taxBeforeCap: fromSatang(taxBeforeCap),
		taxCap: fromSatang(capped.taxCap),
		wasClamped: capped.wasClamped,
		tax: fromSatang(capped.tax),
	}
}
