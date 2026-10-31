/**
 * @excited-live/tax/th — Thailand Tax System
 *
 * Full statutory calculations land in follow-up issues (#8, #9).
 */

export const TH_DEFAULT_TAX_YEAR = 2026

export interface ThTaxInput {
	readonly taxYear?: number
	readonly assessableIncome?: number
}

export interface ThTaxBreakdown {
	readonly assessableIncome: number
}
