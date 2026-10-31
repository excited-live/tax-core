import { fromMinorUnits, type Money, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type {
	UsAdjustmentsBreakdown,
	UsAdjustmentsInput,
	UsFilingStatus,
	UsIncomeInput,
} from "../types"
import { calculateUsAdjustments } from "./adjustments"

export interface UsAgiStageResult {
	readonly ordinaryGrossCents: number
	readonly preferentialGrossCents: number
	readonly grossIncomeCents: number
	readonly totalAdjustmentsCents: number
	readonly agiCents: number
	readonly ordinaryGrossIncome: Money<"USD">
	readonly preferentialGrossIncome: Money<"USD">
	readonly grossIncome: Money<"USD">
	readonly agi: Money<"USD">
	readonly adjustments: UsAdjustmentsBreakdown
}

function sumOrdinaryIncomeCents(income: UsIncomeInput): number {
	return (
		toMinorUnits(income.w2Wages ?? 0, "USD", "w2Wages") +
		toMinorUnits(income.selfEmploymentNetEarnings ?? 0, "USD", "selfEmploymentNetEarnings") +
		toMinorUnits(income.ordinaryInterest ?? 0, "USD", "ordinaryInterest") +
		toMinorUnits(income.ordinaryDividends ?? 0, "USD", "ordinaryDividends") +
		toMinorUnits(income.shortTermCapitalGains ?? 0, "USD", "shortTermCapitalGains") +
		toMinorUnits(income.rentalAndOtherOrdinaryIncome ?? 0, "USD", "rentalAndOtherOrdinaryIncome")
	)
}

function sumPreferentialIncomeCents(income: UsIncomeInput): number {
	return (
		toMinorUnits(income.longTermCapitalGains ?? 0, "USD", "longTermCapitalGains") +
		toMinorUnits(income.qualifiedDividends ?? 0, "USD", "qualifiedDividends")
	)
}

/**
 * Computes Gross Income, clamped Schedule 1 Adjustments, and AGI in minor units.
 *
 * @statute IRC § 61, § 62
 */
export function calculateUsAgi(
	income: UsIncomeInput,
	adjustments: UsAdjustmentsInput | undefined,
	filingStatus: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsAgiStageResult {
	const ordinaryCents = sumOrdinaryIncomeCents(income)
	const prefCents = sumPreferentialIncomeCents(income)
	const grossCents = ordinaryCents + prefCents

	const adjResult = calculateUsAdjustments(adjustments, filingStatus, params)
	const agiCents = Math.max(0, grossCents - adjResult.totalAdjCents)

	return {
		ordinaryGrossCents: ordinaryCents,
		preferentialGrossCents: prefCents,
		grossIncomeCents: grossCents,
		totalAdjustmentsCents: adjResult.totalAdjCents,
		agiCents,
		ordinaryGrossIncome: usd(fromMinorUnits(ordinaryCents, "USD")),
		preferentialGrossIncome: usd(fromMinorUnits(prefCents, "USD")),
		grossIncome: usd(fromMinorUnits(grossCents, "USD")),
		agi: usd(fromMinorUnits(agiCents, "USD")),
		adjustments: adjResult.breakdown,
	}
}
