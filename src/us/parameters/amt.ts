import type { UsFilingStatus } from "../types"

export interface UsAmtParameters {
	readonly baseExemptions: Record<UsFilingStatus, number>
	readonly phaseoutThresholds: Record<UsFilingStatus, number>
	readonly phaseoutRate: number
	readonly rate26Thresholds: Record<UsFilingStatus, number>
	readonly rate26: number
	readonly rate28: number
}

/**
 * Statutory 2026 Alternative Minimum Tax (AMT) exemptions, phaseouts, and rates.
 *
 * @statute IRC § 55
 */
export const US_2026_AMT: UsAmtParameters = {
	baseExemptions: {
		single: 90_100,
		married_filing_jointly: 140_200,
		married_filing_separately: 70_100,
		head_of_household: 90_100,
	},
	phaseoutThresholds: {
		single: 643_250,
		married_filing_jointly: 1_286_500,
		married_filing_separately: 643_250,
		head_of_household: 643_250,
	},
	phaseoutRate: 0.25,
	rate26Thresholds: {
		single: 239_100,
		married_filing_jointly: 239_100,
		married_filing_separately: 119_550,
		head_of_household: 239_100,
	},
	rate26: 0.26,
	rate28: 0.28,
}
