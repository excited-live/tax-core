import { applyPercentage, fromMinorUnits, type Money, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsFilingStatus, UsIncomeInput, UsNiitBreakdown, UsTaxInput } from "../types"

export interface UsNiitStageResult {
	readonly taxCents: number
	readonly tax: Money<"USD">
	readonly breakdown: UsNiitBreakdown
}

function resolveNiiCents(income: UsIncomeInput, override?: number): number {
	if (override !== undefined) {
		return toMinorUnits(override, "USD", "netInvestmentIncome")
	}
	return (
		toMinorUnits(income.ordinaryInterest ?? 0, "USD", "ordinaryInterest") +
		toMinorUnits(income.ordinaryDividends ?? 0, "USD", "ordinaryDividends") +
		toMinorUnits(income.qualifiedDividends ?? 0, "USD", "qualifiedDividends") +
		toMinorUnits(income.shortTermCapitalGains ?? 0, "USD", "shortTermCapitalGains") +
		toMinorUnits(income.longTermCapitalGains ?? 0, "USD", "longTermCapitalGains") +
		toMinorUnits(income.rentalAndOtherOrdinaryIncome ?? 0, "USD", "rentalAndOtherOrdinaryIncome")
	)
}

/**
 * Computes 3.8% Net Investment Income Tax (NIIT) on the lesser of NII or excess MAGI.
 *
 * @statute IRC § 1411
 */
export function calculateUsNiit(
	input: UsTaxInput,
	agiCents: number,
	filingStatus: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsNiitStageResult {
	const niiCents = resolveNiiCents(input.income, input.netInvestmentIncome)
	const magiCents = input.magi !== undefined ? toMinorUnits(input.magi, "USD", "magi") : agiCents

	const thresholdDollars = params.niit.thresholds[filingStatus]
	const thresholdCents = toMinorUnits(thresholdDollars, "USD")
	const excessMagiCents = Math.max(0, magiCents - thresholdCents)

	const subjectCents = Math.min(niiCents, excessMagiCents)
	const taxCents = applyPercentage(subjectCents, params.niit.rate)

	return {
		taxCents,
		tax: usd(fromMinorUnits(taxCents, "USD")),
		breakdown: {
			netInvestmentIncome: usd(fromMinorUnits(niiCents, "USD")),
			magi: usd(fromMinorUnits(magiCents, "USD")),
			threshold: usd(fromMinorUnits(thresholdCents, "USD")),
			excessMagi: usd(fromMinorUnits(excessMagiCents, "USD")),
			subjectAmount: usd(fromMinorUnits(subjectCents, "USD")),
			tax: usd(fromMinorUnits(taxCents, "USD")),
		},
	}
}
