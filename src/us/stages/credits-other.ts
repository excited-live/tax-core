import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsCreditsInput, UsEducationCreditsBreakdown, UsFilingStatus } from "../types"

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

function calculateCareCredit(
	credits: UsCreditsInput | undefined,
	earnedDollars: number,
	agiDollars: number,
	p: typeof US_2026_PARAMETERS,
) {
	const individuals = Math.max(0, credits?.qualifyingIndividualsForCare ?? 0)
	if (individuals <= 0) return 0
	const maxExp = individuals >= 2 ? p.credits.careMaxExpenseTwoPlus : p.credits.careMaxExpenseOne
	const expenses = Math.min(
		Math.max(0, credits?.childAndDependentCareExpenses ?? 0),
		maxExp,
		earnedDollars,
	)
	const excessAgi = Math.max(0, agiDollars - p.credits.carePhaseoutAgiThreshold)
	const rateReduction = Math.ceil(excessAgi / 2_000) * 0.01
	const rate = Math.max(p.credits.careFloorRate, p.credits.careBaseRate - rateReduction)
	return toMinorUnits(expenses * rate, p.currency)
}

function calculateEducationCredits(
	credits: UsCreditsInput | undefined,
	magiDollars: number,
	status: UsFilingStatus,
	p: typeof US_2026_PARAMETERS,
) {
	if (status === "married_filing_separately") return { nonRefAotc: 0, refAotc: 0, nonRefLlc: 0 }
	const pMin = p.credits.aotcPhaseoutMin[status],
		pMax = p.credits.aotcPhaseoutMax[status]
	const factor =
		magiDollars <= pMin ? 1 : magiDollars >= pMax ? 0 : (pMax - magiDollars) / (pMax - pMin)
	let rawAotc = 0,
		llcExp = 0
	for (const student of credits?.educationStudents ?? []) {
		if (student.type === "aotc") {
			const exp = Math.max(0, student.qualifiedExpenses)
			rawAotc += (Math.min(exp, 2_000) + Math.max(0, Math.min(exp, 4_000) - 2_000) * 0.25) * factor
		} else {
			llcExp += Math.max(0, student.qualifiedExpenses)
		}
	}
	const refAotc = toMinorUnits(rawAotc * p.credits.aotcRefundableRate, p.currency)
	const nonRefAotc = toMinorUnits(rawAotc * (1 - p.credits.aotcRefundableRate), p.currency)
	const rawLlc = Math.min(llcExp, p.credits.llcMaxExpensePerReturn) * p.credits.llcRate * factor
	return { nonRefAotc, refAotc, nonRefLlc: toMinorUnits(rawLlc, p.currency) }
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
	p: typeof US_2026_PARAMETERS,
): UsOtherCreditsResult {
	const careCents = calculateCareCredit(credits, earnedDollars, agiDollars, p)
	const edu = calculateEducationCredits(credits, magiDollars, status, p)
	const ftcCents = toMinorUnits(Math.max(0, credits?.foreignTaxCredit ?? 0), p.currency)
	const custNonRefCents = toMinorUnits(
		Math.max(0, credits?.customNonRefundableCredits ?? 0),
		p.currency,
	)
	const custRefCents = toMinorUnits(Math.max(0, credits?.customRefundableCredits ?? 0), p.currency)

	return {
		careNonRefundableCents: careCents,
		aotcNonRefundableCents: edu.nonRefAotc,
		aotcRefundableCents: edu.refAotc,
		llcNonRefundableCents: edu.nonRefLlc,
		foreignTaxCreditCents: ftcCents,
		customNonRefundableCents: custNonRefCents,
		customRefundableCents: custRefCents,
		educationBreakdown: {
			aotcNonRefundable: usd(fromMinorUnits(edu.nonRefAotc, p.currency)),
			aotcRefundable: usd(fromMinorUnits(edu.refAotc, p.currency)),
			llcNonRefundable: usd(fromMinorUnits(edu.nonRefLlc, p.currency)),
			totalNonRefundable: usd(fromMinorUnits(edu.nonRefAotc + edu.nonRefLlc, p.currency)),
			totalRefundable: usd(fromMinorUnits(edu.refAotc, p.currency)),
		},
	}
}
