import type { Money } from "../../core/money"

/**
 * Breakdown of W-2 FICA payroll taxes.
 *
 * @statute IRC § 3101
 */
export interface UsFicaBreakdown {
	readonly enabled: boolean
	readonly socialSecurityWages: Money<"USD">
	readonly socialSecurityTax: Money<"USD">
	readonly medicareWages: Money<"USD">
	readonly medicareTax: Money<"USD">
	readonly additionalMedicareSubject: Money<"USD">
	readonly additionalMedicareTax: Money<"USD">
	readonly totalFicaTax: Money<"USD">
}

/**
 * Breakdown of Schedule SE Self-Employment Tax (SECA).
 *
 * @statute IRC § 1401, § 1402
 */
export interface UsScheduleSeBreakdown {
	readonly netEarnings: Money<"USD">
	readonly netEarningsMultiplier: number
	readonly subjectEarnings: Money<"USD">
	readonly socialSecurityTaxable: Money<"USD">
	readonly socialSecurityTax: Money<"USD">
	readonly medicareTax: Money<"USD">
	readonly totalSelfEmploymentTax: Money<"USD">
	readonly deductiblePortion: Money<"USD">
}
