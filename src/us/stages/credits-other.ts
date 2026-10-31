import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsCreditsInput, UsEducationCreditsBreakdown, UsFilingStatus } from "../types"
import { calculateUsCareCredit } from "./credits-care"

export interface UsOtherCreditsResult {
	readonly careNonRefundableCents: number
	readonly aotcNonRefundableCents: number
	readonly aotcRefundableCents: number
	readonly llcNonRefundableCents: number
	readonly foreignTaxCreditCents: number
	readonly customNonRefundableCents: number
	readonly customRefundableCents: number
	readonly educationBreakdown: UsEducationCreditsBreakdown
}

function calculateEducationCredits(
	credits: UsCreditsInput | undefined,
	magiDollars: number,
	status: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
) {
	if (status === "married_filing_separately") return { nonRefAotc: 0, refAotc: 0, nonRefLlc: 0 }
	const pMin = params.credits.aotcPhaseoutMin[status]
	const pMax = params.credits.aotcPhaseoutMax[status]
	const factor =
		magiDollars <= pMin ? 1 : magiDollars >= pMax ? 0 : (pMax - magiDollars) / (pMax - pMin)
	let rawAotc = 0
	let llcExp = 0
	for (const student of credits?.educationStudents ?? []) {
		if (student.type === "aotc") {
			const exp = Math.max(0, student.qualifiedExpenses)
			const tier1 = Math.min(exp, params.credits.aotcTier1MaxExpense) * params.credits.aotcTier1Rate
			const tier2 =
				Math.max(
					0,
					Math.min(exp - params.credits.aotcTier1MaxExpense, params.credits.aotcTier2MaxExpense),
				) * params.credits.aotcTier2Rate
			rawAotc += (tier1 + tier2) * factor
		} else {
			llcExp += Math.max(0, student.qualifiedExpenses)
		}
	}
	const refAotc = toMinorUnits(rawAotc * params.credits.aotcRefundableRate, params.currency)
	const nonRefAotc = toMinorUnits(
		rawAotc * (1 - params.credits.aotcRefundableRate),
		params.currency,
	)
	const rawLlc =
		Math.min(llcExp, params.credits.llcMaxExpensePerReturn) * params.credits.llcRate * factor
	return { nonRefAotc, refAotc, nonRefLlc: toMinorUnits(rawLlc, params.currency) }
}

/**
 * Computes Child and Dependent Care, Education, Foreign Tax, and Custom credits.
 *
 * @statute IRC §§ 21, 25A, 901
 */
export function calculateUsOtherCredits(
	credits: UsCreditsInput | undefined,
	earnedDollars: number,
	agiDollars: number,
	magiDollars: number,
	status: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsOtherCreditsResult {
	const careCents = calculateUsCareCredit(credits, earnedDollars, agiDollars, params)
	const edu = calculateEducationCredits(credits, magiDollars, status, params)
	const ftcCents = toMinorUnits(Math.max(0, credits?.foreignTaxCredit ?? 0), params.currency)
	const custNonRefCents = toMinorUnits(
		Math.max(0, credits?.customNonRefundableCredits ?? 0),
		params.currency,
	)
	const custRefCents = toMinorUnits(
		Math.max(0, credits?.customRefundableCredits ?? 0),
		params.currency,
	)

	return {
		careNonRefundableCents: careCents,
		aotcNonRefundableCents: edu.nonRefAotc,
		aotcRefundableCents: edu.refAotc,
		llcNonRefundableCents: edu.nonRefLlc,
		foreignTaxCreditCents: ftcCents,
		customNonRefundableCents: custNonRefCents,
		customRefundableCents: custRefCents,
		educationBreakdown: {
			aotcNonRefundable: usd(fromMinorUnits(edu.nonRefAotc, params.currency)),
			aotcRefundable: usd(fromMinorUnits(edu.refAotc, params.currency)),
			llcNonRefundable: usd(fromMinorUnits(edu.nonRefLlc, params.currency)),
			totalNonRefundable: usd(fromMinorUnits(edu.nonRefAotc + edu.nonRefLlc, params.currency)),
			totalRefundable: usd(fromMinorUnits(edu.refAotc, params.currency)),
		},
	}
}
