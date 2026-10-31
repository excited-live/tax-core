import {
	applyPercentage,
	multiplySafeInteger,
	validateMonetaryAmount,
	validateSafeIntegerCount,
} from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	type ThSeparateSheetBreakdown,
	type ThSeparateSheetInput,
	ThSpecialRegimeField,
} from "../types"
import { fromSatang, toSatang } from "../units"
import { evaluateThBracketSet } from "./bracket-eval"

const EMPTY_INPUT: ThSeparateSheetInput = { amount: 0, yearsOfService: 0, lastDailyWage: 0 }

/**
 * Calculates the Section 48(5) separate sheet for one-time severance/retirement lump sums.
 *
 * Purpose: Taxes an eligible lump sum on its own schedule, or returns it for regular treatment.
 * Math (eligible when yearsOfService >= 5):
 * exemption = min(amount, 400 * lastDailyWage, 600,000); remainder = amount - exemption;
 * fixed = min(7,000 * years, remainder); percentage expense = 50% of (remainder - fixed), half-up;
 * net = remainder - fixed - percentage expense, taxed on the separate schedule (5%..35%, no 0% tier).
 * Ineligible lump sums are returned in `addedToSection40_1` for the regular computation instead.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError for negative/non-finite money, a non-safe-integer/negative `yearsOfService`,
 * or a wage/years value whose scaled satang amount exceeds the safe integer range.
 *
 * @statute Thailand Revenue Code Section 48(5); Section 42(1) (severance exemption).
 */
export function calculateSeparateSheet(
	input: ThSeparateSheetInput = EMPTY_INPUT,
): ThSeparateSheetBreakdown {
	const rules = TH_2026_PARAMETERS.separateSheet
	validateMonetaryAmount(input.amount, ThSpecialRegimeField.SeparateSheetAmount)
	validateMonetaryAmount(input.lastDailyWage, ThSpecialRegimeField.SeparateSheetLastDailyWage)
	validateSafeIntegerCount(input.yearsOfService, ThSpecialRegimeField.SeparateSheetYears)

	const years = input.yearsOfService
	const isEligible = years >= rules.minYearsOfService
	const amountSatang = isEligible
		? toSatang(input.amount, ThSpecialRegimeField.SeparateSheetAmount)
		: 0
	const wageSatang = toSatang(input.lastDailyWage, ThSpecialRegimeField.SeparateSheetLastDailyWage)
	const wageCap = isEligible
		? multiplySafeInteger(
				wageSatang,
				rules.exemptionWageDays,
				ThSpecialRegimeField.SeparateSheetLastDailyWage,
			)
		: 0
	const exemption = Math.min(amountSatang, wageCap, toSatang(rules.exemptionCeiling))
	const remainder = amountSatang - exemption
	const fixedCap = multiplySafeInteger(
		toSatang(rules.expensePerYearOfService),
		years,
		ThSpecialRegimeField.SeparateSheetYears,
	)
	const fixed = Math.min(remainder, fixedCap)
	const percentage = applyPercentage(remainder - fixed, rules.remainderExpenseRate)
	const net = fromSatang(remainder - fixed - percentage)

	const evaluated = evaluateThBracketSet(net, net, rules.brackets)
	return {
		amount: input.amount,
		yearsOfService: years,
		lastDailyWage: input.lastDailyWage,
		isEligible,
		addedToSection40_1: isEligible ? 0 : input.amount,
		wageBasedCap: fromSatang(wageCap),
		exemptionCeiling: rules.exemptionCeiling,
		exemption: fromSatang(exemption),
		remainder: fromSatang(remainder),
		fixedExpense: fromSatang(fixed),
		percentageExpense: fromSatang(percentage),
		netTaxable: net,
		brackets: evaluated.brackets,
		tax: evaluated.totalTax,
	}
}
