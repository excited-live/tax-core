import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsFilingStatus, UsStandardDeductionBreakdown, UsTaxInput } from "../types"

export interface UsStandardDeductionResult {
	readonly totalCents: number
	readonly breakdown: UsStandardDeductionBreakdown
}

function countAdditionalConditions(input: UsTaxInput, isUnmarried: boolean): number {
	let count = 0
	if (input.taxpayerAge65OrOlder) count++
	if (input.taxpayerBlind) count++
	if (!isUnmarried) {
		if (input.spouseAge65OrOlder) count++
		if (input.spouseBlind) count++
	}
	return count
}

/**
 * Computes base and additional standard deduction for age and blindness in minor units.
 *
 * @statute IRC § 63(c), § 63(f)
 */
export function calculateUsStandardDeduction(
	input: UsTaxInput,
	filingStatus: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsStandardDeductionResult {
	const baseDollars = params.standardDeduction[filingStatus]
	const baseCents = toMinorUnits(baseDollars, "USD")
	const isUnmarried = filingStatus === "single" || filingStatus === "head_of_household"
	const perCondDollars = isUnmarried
		? params.additionalStandardDeduction.unmarried
		: params.additionalStandardDeduction.married
	const perCondCents = toMinorUnits(perCondDollars, "USD")

	const condCount = countAdditionalConditions(input, isUnmarried)
	const addTotalCents = condCount * perCondCents
	const totalCents = baseCents + addTotalCents

	return {
		totalCents,
		breakdown: {
			base: usd(fromMinorUnits(baseCents, "USD")),
			additionalConditionsCount: condCount,
			additionalPerCondition: usd(fromMinorUnits(perCondCents, "USD")),
			additionalTotal: usd(fromMinorUnits(addTotalCents, "USD")),
			total: usd(fromMinorUnits(totalCents, "USD")),
		},
	}
}
