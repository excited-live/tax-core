import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsCreditsInput, UsEitcBreakdown, UsFilingStatus } from "../types"
import { UsCreditField } from "../types/fields"

export interface UsEitcResult {
	readonly creditCents: number
	readonly breakdown: UsEitcBreakdown
}

function resolveTierKey(count: number): 0 | 1 | 2 | 3 {
	if (count <= 0) return 0
	if (count === 1) return 1
	if (count === 2) return 2
	return 3
}

/**
 * Computes Earned Income Tax Credit (EITC) across child tiers 0, 1, 2, 3+.
 *
 * @statute IRC § 32
 */
export function calculateUsEitc(
	credits: UsCreditsInput | undefined,
	earnedIncomeDollars: number,
	investmentIncomeDollars: number,
	agiDollars: number,
	status: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsEitcResult {
	const children = Math.max(0, Math.floor(credits?.eitcQualifyingChildren ?? 0))
	const invLimit = params.credits.eitcInvestmentIncomeLimit
	const isDisqualified =
		investmentIncomeDollars > invLimit || status === "married_filing_separately"

	if (isDisqualified || earnedIncomeDollars <= 0) {
		return {
			creditCents: 0,
			breakdown: {
				qualifyingChildren: children,
				earnedIncome: usd(
					fromMinorUnits(
						toMinorUnits(Math.max(0, earnedIncomeDollars), params.currency),
						params.currency,
					),
				),
				disqualifiedByInvestmentIncome: investmentIncomeDollars > invLimit,
				credit: usd(0),
			},
		}
	}

	const tierKey = resolveTierKey(children)
	const tier = params.credits.eitcTiers[tierKey]
	const tentative = Math.min(earnedIncomeDollars * tier.creditRate, tier.maxCredit)

	const phaseoutBasis = Math.max(earnedIncomeDollars, agiDollars)
	const thresh =
		status === "married_filing_jointly" ? tier.phaseoutThresholdMfj : tier.phaseoutThresholdSingle
	const excess = Math.max(0, phaseoutBasis - thresh)
	const reduction = excess * tier.phaseoutRate
	const creditDollars = Math.max(0, tentative - reduction)
	const creditCents = toMinorUnits(creditDollars, params.currency)

	return {
		creditCents,
		breakdown: {
			qualifyingChildren: children,
			earnedIncome: usd(
				fromMinorUnits(toMinorUnits(earnedIncomeDollars, params.currency), params.currency),
			),
			disqualifiedByInvestmentIncome: false,
			credit: usd(
				fromMinorUnits(creditCents, params.currency, UsCreditField.EarnedIncomeTaxCredit),
			),
		},
	}
}
