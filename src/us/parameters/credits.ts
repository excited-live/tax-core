import type { UsFilingStatus } from "../types"
import { US_2026_EITC_TIERS, type UsEitcTier } from "./credits-eitc"

export type { UsEitcTier }

export interface UsCreditsParameters {
	readonly ctcAmountPerChild: number
	readonly actcMaxPerChild: number
	readonly actcEarnedIncomeThreshold: number
	readonly actcRate: number
	readonly ctcPhaseoutThresholds: Record<UsFilingStatus, number>
	readonly ctcPhaseoutStepAmount: number
	readonly ctcPhaseoutStepRate: number
	readonly odcAmountPerDependent: number
	readonly eitcInvestmentIncomeLimit: number
	readonly eitcTiers: Record<0 | 1 | 2 | 3, UsEitcTier>
	readonly careMaxExpenseOne: number
	readonly careMaxExpenseTwoPlus: number
	readonly careBaseRate: number
	readonly careFloorRate: number
	readonly carePhaseoutAgiThreshold: number
	readonly aotcMaxPerStudent: number
	readonly aotcRefundableRate: number
	readonly aotcPhaseoutMin: Record<UsFilingStatus, number>
	readonly aotcPhaseoutMax: Record<UsFilingStatus, number>
	readonly llcMaxExpensePerReturn: number
	readonly llcRate: number
}

/**
 * Statutory 2026 Federal Tax Credits parameters.
 *
 * @statute IRC § 21, § 24, § 25A, § 32
 */
export const US_2026_CREDITS: UsCreditsParameters = {
	ctcAmountPerChild: 2_000,
	actcMaxPerChild: 1_700,
	actcEarnedIncomeThreshold: 2_500,
	actcRate: 0.15,
	ctcPhaseoutThresholds: {
		single: 200_000,
		married_filing_jointly: 400_000,
		married_filing_separately: 200_000,
		head_of_household: 200_000,
	},
	ctcPhaseoutStepAmount: 1_000,
	ctcPhaseoutStepRate: 50,
	odcAmountPerDependent: 500,
	eitcInvestmentIncomeLimit: 11_950,
	eitcTiers: US_2026_EITC_TIERS,
	careMaxExpenseOne: 3_000,
	careMaxExpenseTwoPlus: 6_000,
	careBaseRate: 0.35,
	careFloorRate: 0.2,
	carePhaseoutAgiThreshold: 15_000,
	aotcMaxPerStudent: 2_500,
	aotcRefundableRate: 0.4,
	aotcPhaseoutMin: {
		single: 80_000,
		head_of_household: 80_000,
		married_filing_jointly: 160_000,
		married_filing_separately: 0,
	},
	aotcPhaseoutMax: {
		single: 90_000,
		head_of_household: 90_000,
		married_filing_jointly: 180_000,
		married_filing_separately: 0,
	},
	llcMaxExpensePerReturn: 10_000,
	llcRate: 0.2,
}
