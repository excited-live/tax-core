import { fromMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsCreditsBreakdown, UsTaxInput } from "../types"
import { calculateUsChildCredits } from "./credits-child"
import { calculateUsEitc } from "./credits-eitc"
import { calculateUsOtherCredits } from "./credits-other"

export interface UsCreditsResult {
	readonly allowedNonRefundableCents: number
	readonly totalRefundableCents: number
	readonly breakdown: UsCreditsBreakdown
}

/**
 * Coordinates and computes all statutory federal tax credits.
 *
 * @statute IRC §§ 21, 24, 25A, 32, 901
 */
export function calculateUsCredits(
	input: UsTaxInput,
	agiCents: number,
	taxAvailableCents: number,
	params: typeof US_2026_PARAMETERS,
): UsCreditsResult {
	const agiDollars = fromMinorUnits(agiCents, params.currency)
	const magiDollars = input.magi ?? agiDollars
	const w2 = Math.max(0, input.income.w2Wages ?? 0)
	const se = Math.max(
		0,
		(input.income.selfEmploymentNetEarnings ?? 0) * params.payroll.seNetEarningsFactor,
	)
	const earnedDollars = w2 + se
	const invDollars =
		(input.credits?.eitcInvestmentIncome ?? 0) +
		Math.max(0, input.income.ordinaryInterest ?? 0) +
		Math.max(0, input.income.ordinaryDividends ?? 0) +
		Math.max(0, input.income.longTermCapitalGains ?? 0)

	const child = calculateUsChildCredits(
		input.credits,
		magiDollars,
		earnedDollars,
		taxAvailableCents,
		input.filingStatus,
		params,
	)
	const eitc = calculateUsEitc(
		input.credits,
		earnedDollars,
		invDollars,
		agiDollars,
		input.filingStatus,
		params,
	)
	const other = calculateUsOtherCredits(
		input.credits,
		earnedDollars,
		agiDollars,
		magiDollars,
		input.filingStatus,
		params,
	)

	const totalNonRefClaimed =
		child.nonRefundableUsedCents +
		other.careNonRefundableCents +
		other.aotcNonRefundableCents +
		other.llcNonRefundableCents +
		other.foreignTaxCreditCents +
		other.customNonRefundableCents
	const allowedNonRefCents = Math.min(totalNonRefClaimed, taxAvailableCents)
	const totalRefCents =
		child.actcRefundableCents +
		eitc.creditCents +
		other.aotcRefundableCents +
		other.customRefundableCents

	return {
		allowedNonRefundableCents: allowedNonRefCents,
		totalRefundableCents: totalRefCents,
		breakdown: {
			childCredits: child.breakdown,
			eitc: eitc.breakdown,
			childAndDependentCare: usd(fromMinorUnits(other.careNonRefundableCents, params.currency)),
			education: other.educationBreakdown,
			foreignTaxCredit: usd(fromMinorUnits(other.foreignTaxCreditCents, params.currency)),
			customNonRefundable: usd(fromMinorUnits(other.customNonRefundableCents, params.currency)),
			customRefundable: usd(fromMinorUnits(other.customRefundableCents, params.currency)),
			totalNonRefundableClaimed: usd(fromMinorUnits(totalNonRefClaimed, params.currency)),
			totalNonRefundableAllowed: usd(fromMinorUnits(allowedNonRefCents, params.currency)),
			totalRefundable: usd(fromMinorUnits(totalRefCents, params.currency)),
		},
	}
}
