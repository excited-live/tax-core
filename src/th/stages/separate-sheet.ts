import {
	applyPercentage,
	fromMinorUnits,
	toMinorUnits,
	validateMonetaryAmount,
	validateSafeIntegerCount,
} from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	type ThSeparateSheetBreakdown,
	type ThSeparateSheetInput,
	ThSpecialRegimeField,
} from "../types"
import { evaluateThBracketSet } from "./bracket-eval"

const EMPTY_INPUT: ThSeparateSheetInput = { amount: 0, yearsOfService: 0, lastDailyWage: 0 }

/**
 * Calculates the Section 48(5) separate sheet for one-time severance/retirement lump sums.
 *
 * Math (eligible when yearsOfService >= 5):
 * exemption = min(amount, 400 * lastDailyWage, 600,000); remainder = amount - exemption;
 * fixed = min(7,000 * years, remainder); percentage expense = 50% of (remainder - fixed), half-up;
 * net = remainder - fixed - percentage expense, taxed on the separate schedule (5%..35%, no 0% tier).
 * Ineligible lump sums are returned in `addedToSection40_1` for the regular computation instead.
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError for negative/non-finite money or a non-safe-integer/negative `yearsOfService`.
 *
 * @statute Thailand Revenue Code Section 48(5); Section 42(1) (severance exemption).
 */
export function calculateSeparateSheet(
	input: ThSeparateSheetInput = EMPTY_INPUT,
): ThSeparateSheetBreakdown {
	const p = TH_2026_PARAMETERS.separateSheet
	const currency = TH_2026_PARAMETERS.currency
	validateMonetaryAmount(input.amount, ThSpecialRegimeField.SeparateSheetAmount)
	validateMonetaryAmount(input.lastDailyWage, ThSpecialRegimeField.SeparateSheetLastDailyWage)
	validateSafeIntegerCount(input.yearsOfService, ThSpecialRegimeField.SeparateSheetYears)

	const isEligible = input.yearsOfService >= p.minYearsOfService
	const amountMinor = isEligible
		? toMinorUnits(input.amount, currency, ThSpecialRegimeField.SeparateSheetAmount)
		: 0
	const wage = toMinorUnits(
		input.lastDailyWage,
		currency,
		ThSpecialRegimeField.SeparateSheetLastDailyWage,
	)
	const wageCap = isEligible ? wage * p.exemptionWageDays : 0
	const ceiling = toMinorUnits(p.exemptionCeiling, currency)
	const exemption = Math.min(amountMinor, wageCap, ceiling)
	const remainder = amountMinor - exemption
	const perYear = toMinorUnits(p.expensePerYearOfService, currency)
	const fixed = Math.min(remainder, perYear * input.yearsOfService)
	const percentage = applyPercentage(remainder - fixed, p.remainderExpenseRate)
	const net = fromMinorUnits(remainder - fixed - percentage, currency)

	const evaluated = evaluateThBracketSet(net, net, p.brackets)
	const major = (minor: number): number => fromMinorUnits(minor, currency)
	return {
		amount: input.amount,
		yearsOfService: input.yearsOfService,
		lastDailyWage: input.lastDailyWage,
		isEligible,
		addedToSection40_1: isEligible ? 0 : input.amount,
		wageBasedCap: major(wageCap),
		exemptionCeiling: p.exemptionCeiling,
		exemption: major(exemption),
		remainder: major(remainder),
		fixedExpense: major(fixed),
		percentageExpense: major(percentage),
		netTaxable: net,
		brackets: evaluated.brackets,
		tax: evaluated.totalTax,
	}
}
