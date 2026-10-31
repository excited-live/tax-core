import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsIncomeInput, UsScheduleSeBreakdown } from "../types"
import { UsPayrollField } from "../types/fields"

export interface UsScheduleSeResult {
	readonly totalSeTaxCents: number
	readonly deductiblePortionCents: number
	readonly deductiblePortionDollars: number
	readonly breakdown: UsScheduleSeBreakdown
}

/**
 * Computes Schedule SE Self-Employment Tax (SECA).
 *
 * @statute IRC § 1401, § 1402
 */
export function calculateUsScheduleSe(
	income: UsIncomeInput,
	params: typeof US_2026_PARAMETERS,
): UsScheduleSeResult {
	const rawNetEarnings = Math.max(0, income.selfEmploymentNetEarnings ?? 0)
	const factor = params.payroll.seNetEarningsFactor
	const subjectAmount = rawNetEarnings * factor
	const applies = subjectAmount >= params.payroll.seThresholdFloor

	const w2Dollars = Math.max(0, income.w2Wages ?? 0)
	const remainingWageBase = Math.max(0, params.payroll.socialSecurityWageBase - w2Dollars)
	const ssTaxableDollars = applies ? Math.min(subjectAmount, remainingWageBase) : 0

	const ssTaxCents = Math.round(ssTaxableDollars * params.payroll.seSocialSecurityRate * 100)
	const medTaxCents = applies ? Math.round(subjectAmount * params.payroll.seMedicareRate * 100) : 0
	const totalSeTaxCents = ssTaxCents + medTaxCents
	const deductibleCents = Math.round(totalSeTaxCents * params.payroll.seDeductibleRate)

	return {
		totalSeTaxCents,
		deductiblePortionCents: deductibleCents,
		deductiblePortionDollars: fromMinorUnits(deductibleCents, params.currency),
		breakdown: {
			netEarnings: usd(
				fromMinorUnits(toMinorUnits(rawNetEarnings, params.currency), params.currency),
			),
			netEarningsMultiplier: factor,
			subjectEarnings: usd(
				fromMinorUnits(toMinorUnits(applies ? subjectAmount : 0, params.currency), params.currency),
			),
			socialSecurityTaxable: usd(
				fromMinorUnits(toMinorUnits(ssTaxableDollars, params.currency), params.currency),
			),
			socialSecurityTax: usd(
				fromMinorUnits(ssTaxCents, params.currency, UsPayrollField.SeSocialSecurity),
			),
			medicareTax: usd(fromMinorUnits(medTaxCents, params.currency, UsPayrollField.SeMedicare)),
			totalSelfEmploymentTax: usd(fromMinorUnits(totalSeTaxCents, params.currency)),
			deductiblePortion: usd(
				fromMinorUnits(deductibleCents, params.currency, UsPayrollField.SeDeductiblePortion),
			),
		},
	}
}
