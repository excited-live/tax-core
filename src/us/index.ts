/**
 * @excited-live/tax/us — United States Tax System
 *
 * Full statutory calculations land in follow-up issues (#10, #11, #12).
 */

export const US_DEFAULT_TAX_YEAR = 2026

export interface UsTaxInput {
	readonly taxYear?: number
	readonly grossIncome?: number
}

export interface UsTaxBreakdown {
	readonly grossIncome: number
}
