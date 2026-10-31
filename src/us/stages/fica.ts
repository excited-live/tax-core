import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsFicaBreakdown, UsFilingStatus, UsIncomeInput } from "../types"
import { UsPayrollField } from "../types/fields"

export interface UsFicaResult {
	readonly totalFicaCents: number
	readonly breakdown: UsFicaBreakdown
}

/**
 * Computes W-2 FICA payroll taxes and Additional Medicare Tax on earned income.
 *
 * @statute IRC § 3101, § 1401(b)(2)
 */
export function calculateUsFica(
	income: UsIncomeInput,
	filingStatus: UsFilingStatus,
	includeFica: boolean,
	params: typeof US_2026_PARAMETERS,
): UsFicaResult {
	if (!includeFica) {
		return {
			totalFicaCents: 0,
			breakdown: {
				enabled: false,
				socialSecurityWages: usd(0),
				socialSecurityTax: usd(0),
				medicareWages: usd(0),
				medicareTax: usd(0),
				additionalMedicareSubject: usd(0),
				additionalMedicareTax: usd(0),
				totalFicaTax: usd(0),
			},
		}
	}

	const w2 = Math.max(0, income.w2Wages ?? 0)
	const ssWages = Math.min(w2, params.payroll.socialSecurityWageBase)
	const ssTaxCents = Math.round(ssWages * params.payroll.ficaSocialSecurityRate * 100)
	const medTaxCents = Math.round(w2 * params.payroll.ficaMedicareRate * 100)

	const seSubject = Math.max(
		0,
		(income.selfEmploymentNetEarnings ?? 0) * params.payroll.seNetEarningsFactor,
	)
	const combinedEarned = w2 + seSubject
	const threshold = params.payroll.additionalMedicareThresholds[filingStatus]
	const addMedSubject = Math.max(0, combinedEarned - threshold)
	const addMedTaxCents = Math.round(addMedSubject * params.payroll.additionalMedicareRate * 100)

	const totalCents = ssTaxCents + medTaxCents + addMedTaxCents

	return {
		totalFicaCents: totalCents,
		breakdown: {
			enabled: true,
			socialSecurityWages: usd(
				fromMinorUnits(toMinorUnits(ssWages, params.currency), params.currency),
			),
			socialSecurityTax: usd(
				fromMinorUnits(ssTaxCents, params.currency, UsPayrollField.FicaSocialSecurity),
			),
			medicareWages: usd(fromMinorUnits(toMinorUnits(w2, params.currency), params.currency)),
			medicareTax: usd(fromMinorUnits(medTaxCents, params.currency, UsPayrollField.FicaMedicare)),
			additionalMedicareSubject: usd(
				fromMinorUnits(toMinorUnits(addMedSubject, params.currency), params.currency),
			),
			additionalMedicareTax: usd(
				fromMinorUnits(addMedTaxCents, params.currency, UsPayrollField.FicaAdditionalMedicare),
			),
			totalFicaTax: usd(fromMinorUnits(totalCents, params.currency)),
		},
	}
}
