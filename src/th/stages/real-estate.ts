import {
	applyPercentage,
	fromMinorUnits,
	roundHalfUp,
	toMinorUnits,
	validateMonetaryAmount,
	validateSafeIntegerCount,
} from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	type ThRealEstateBreakdown,
	type ThRealEstateTransferInput,
	ThSpecialRegimeField,
} from "../types"
import { evaluateThBrackets } from "./bracket-eval"

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
 * Clamps real estate tax at the statutory share of the gross transfer value.
 *
 * Math: cap = grossTransferValue * 20%; tax = min(taxBeforeCap, cap).
 * Units: Integer minor units (satang) in and out.
 * Returns an all-zero breakdown when no transfer is given.
 * Throws: TaxValidationError if either amount is not a non-negative safe integer.
 *
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
 * Math: net gain = gross - gross * expenseRate(holdingYears); annual = net / years (half-up satang);
 * annual tax via the regular brackets; tax = annual tax * years, clamped at 20% of gross.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError for negative/non-finite value or a non-positive/non-safe-integer holding period.
 *
 * @statute Thailand Revenue Code Section 48(4), Section 42(5).
 */
export function calculateRealEstateTransfer(
	input: ThRealEstateTransferInput | undefined,
): ThRealEstateBreakdown {
	if (input === undefined) return EMPTY_BREAKDOWN
	const currency = TH_2026_PARAMETERS.currency
	validateMonetaryAmount(input.grossTransferValue, ThSpecialRegimeField.RealEstateGrossValue)
	validateSafeIntegerCount(input.holdingYears, ThSpecialRegimeField.RealEstateHoldingYears, 1)

	const years = input.holdingYears
	const expenseRate = expenseRateFor(years)
	const gross = toMinorUnits(
		input.grossTransferValue,
		currency,
		ThSpecialRegimeField.RealEstateGrossValue,
	)
	const expense = applyPercentage(gross, expenseRate)
	const netGain = gross - expense
	const annualGain = roundHalfUp(netGain / years)
	const annual = evaluateThBrackets(
		fromMinorUnits(annualGain, currency),
		fromMinorUnits(annualGain, currency),
	)
	const taxBeforeCap = toMinorUnits(annual.totalTax, currency) * years
	const capped = applyRealEstateCap(taxBeforeCap, gross)
	const major = (minor: number): number => fromMinorUnits(minor, currency)
	return {
		grossTransferValue: input.grossTransferValue,
		holdingYears: years,
		expenseRate,
		expense: major(expense),
		netGain: major(netGain),
		annualGain: major(annualGain),
		brackets: annual.brackets,
		annualTax: annual.totalTax,
		taxBeforeCap: major(taxBeforeCap),
		taxCap: major(capped.taxCap),
		wasClamped: capped.wasClamped,
		tax: major(capped.tax),
	}
}
