import type { UsFilingStatus } from "../types"

export interface UsPayrollParameters {
	readonly socialSecurityWageBase: number
	readonly ficaSocialSecurityRate: number
	readonly ficaMedicareRate: number
	readonly additionalMedicareRate: number
	readonly additionalMedicareThresholds: Record<UsFilingStatus, number>
	readonly seNetEarningsFactor: number
	readonly seThresholdFloor: number
	readonly seSocialSecurityRate: number
	readonly seMedicareRate: number
	readonly seDeductibleRate: number
}

/**
 * Statutory 2026 FICA & SECA Payroll parameters.
 *
 * @statute IRC § 1401, § 1402, § 3101
 */
export const US_2026_PAYROLL: UsPayrollParameters = {
	socialSecurityWageBase: 181_800,
	ficaSocialSecurityRate: 0.062,
	ficaMedicareRate: 0.0145,
	additionalMedicareRate: 0.009,
	additionalMedicareThresholds: {
		single: 200_000,
		married_filing_jointly: 250_000,
		married_filing_separately: 125_000,
		head_of_household: 200_000,
	},
	seNetEarningsFactor: 0.9235,
	seThresholdFloor: 400,
	seSocialSecurityRate: 0.124,
	seMedicareRate: 0.029,
	seDeductibleRate: 0.5,
}
