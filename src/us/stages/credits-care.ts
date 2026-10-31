import { toMinorUnits } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsCreditsInput } from "../types"

/**
 * Calculates Child and Dependent Care Credit (IRC § 21).
 *
 * @statute IRC § 21
 */
export function calculateUsCareCredit(
	credits: UsCreditsInput | undefined,
	earnedDollars: number,
	agiDollars: number,
	params: typeof US_2026_PARAMETERS,
): number {
	const individuals = Math.max(0, credits?.qualifyingIndividualsForCare ?? 0)
	if (individuals <= 0) return 0
	const maxExp =
		individuals >= 2 ? params.credits.careMaxExpenseTwoPlus : params.credits.careMaxExpenseOne
	const expenses = Math.min(
		Math.max(0, credits?.childAndDependentCareExpenses ?? 0),
		maxExp,
		earnedDollars,
	)
	const excessAgi = Math.max(0, agiDollars - params.credits.carePhaseoutAgiThreshold)
	const rateReduction =
		Math.ceil(excessAgi / params.credits.carePhaseoutStepAgi) * params.credits.carePhaseoutStepRate
	const rate = Math.max(params.credits.careFloorRate, params.credits.careBaseRate - rateReduction)
	return toMinorUnits(expenses * rate, params.currency)
}
