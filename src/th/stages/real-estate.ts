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
	ThRealEstateAcquisitionType,
	type ThRealEstateBreakdown,
	ThRealEstateExpenseBasis,
	type ThRealEstateTransferInput,
	ThSpecialRegimeField,
} from "../types"
import { fromSatang, toSatang } from "../units"
import { resolveChoice } from "../validate"
import { evaluateThBracketSet, evaluateThBrackets } from "./bracket-eval"
import { effectiveHoldingYears, resolveRealEstateExpense } from "./real-estate-expense"

const EMPTY_BREAKDOWN: ThRealEstateBreakdown = {
	grossTransferValue: 0,
	acquisitionType: ThRealEstateAcquisitionType.Commercial,
	expenseBasis: ThRealEstateExpenseBasis.HoldingPeriodTable,
	requestedHoldingYears: 0,
	effectiveHoldingYears: 0,
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

/**
 * Scales every finite annualised-schedule bracket bound by the holding period.
 *
 * Math: `years * tax(net / years)` equals the tax on `net` against bounds multiplied by `years`
 * (each slice `rate * clip(net/years - lo, 0, width) * years = rate * clip(net - lo*years, 0, width*years)`),
 * so the annualisation needs no intermediate rounding.
 * Units: THB major units; scaling performed in integer satang.
 * Throws: TaxValidationError if a scaled bound exceeds the safe integer range (unreachable
 * for the capped holding period).
 */
function scaleBracketsByYears(years: number): readonly TaxBracket[] {
	return TH_2026_PARAMETERS.realEstate.brackets.map((bracket) => {
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
 * Note: Unreachable end to end (top rate 35% of at most 50% net is 17.5% < 20%); kept as the
 * statutory guard.
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
 * `grossTransferValue` must be the official appraised value (ราคาประเมินทุนทรัพย์, Section 49 bis),
 * not the actual sale price. `holdingYears` is a positive safe integer; callers round part-years
 * up, and more than 10 years counts as 10.
 * Math: years = min(holdingYears, 10); expense = gross * 50% for inheritance/gift, otherwise
 * gross * table(years) (never combined); net = gross - expense; tax = years * bracketTax(net / years)
 * on the schedule without a 0% tier (5% from the first baht), evaluated exactly as bracketTax of
 * `net` against bounds multiplied by `years` (no per-year rounding); tax is clamped at 20% of gross
 * (which the 35% top rate on at most 50% net can never reach). `annualGain` and `annualTax` are
 * rounded for display.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError for a negative/non-finite value, a non-positive/non-safe-integer
 * holding period, or an unknown `acquisitionType`.
 *
 * @statute Thailand Revenue Code Section 48(4), Section 42(5), Section 49 bis.
 */
export function calculateRealEstateTransfer(
	input: ThRealEstateTransferInput | undefined,
): ThRealEstateBreakdown {
	if (input === undefined) return EMPTY_BREAKDOWN
	validateMonetaryAmount(input.grossTransferValue, ThSpecialRegimeField.RealEstateGrossValue)
	validateSafeIntegerCount(input.holdingYears, ThSpecialRegimeField.RealEstateHoldingYears, 1)
	const acquisitionType = resolveChoice(
		input.acquisitionType,
		ThRealEstateAcquisitionType,
		ThRealEstateAcquisitionType.Commercial,
		ThSpecialRegimeField.RealEstateAcquisitionType,
	)

	const years = effectiveHoldingYears(input.holdingYears)
	const { basis, rate: expenseRate } = resolveRealEstateExpense(acquisitionType, years)
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
		acquisitionType,
		expenseBasis: basis,
		requestedHoldingYears: input.holdingYears,
		effectiveHoldingYears: years,
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
