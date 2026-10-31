import type { Money } from "../../core/money"

export interface UsChildCreditsBreakdown {
	readonly qualifyingChildren: number
	readonly otherDependents: number
	readonly initialCtc: Money<"USD">
	readonly initialOdc: Money<"USD">
	readonly phaseoutReduction: Money<"USD">
	readonly allowedCtc: Money<"USD">
	readonly allowedOdc: Money<"USD">
	readonly nonRefundableCtcUsed: Money<"USD">
	readonly nonRefundableOdcUsed: Money<"USD">
	readonly actcRefundable: Money<"USD">
}

export interface UsEitcBreakdown {
	readonly qualifyingChildren: number
	readonly earnedIncome: Money<"USD">
	readonly disqualifiedByInvestmentIncome: boolean
	readonly credit: Money<"USD">
}

export interface UsEducationCreditsBreakdown {
	readonly aotcNonRefundable: Money<"USD">
	readonly aotcRefundable: Money<"USD">
	readonly llcNonRefundable: Money<"USD">
	readonly totalNonRefundable: Money<"USD">
	readonly totalRefundable: Money<"USD">
}

export interface UsCreditsBreakdown {
	readonly childCredits: UsChildCreditsBreakdown
	readonly eitc: UsEitcBreakdown
	readonly childAndDependentCare: Money<"USD">
	readonly education: UsEducationCreditsBreakdown
	readonly foreignTaxCredit: Money<"USD">
	readonly customNonRefundable: Money<"USD">
	readonly customRefundable: Money<"USD">
	readonly totalNonRefundableClaimed: Money<"USD">
	readonly totalNonRefundableAllowed: Money<"USD">
	readonly totalRefundable: Money<"USD">
}
