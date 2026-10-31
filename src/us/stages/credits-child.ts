import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsChildCreditsBreakdown, UsCreditsInput, UsFilingStatus } from "../types"
import { UsCreditField } from "../types/fields"

export interface UsChildCreditsResult {
	readonly nonRefundableUsedCents: number
	readonly actcRefundableCents: number
	readonly breakdown: UsChildCreditsBreakdown
}

function resolveCtcAllocation(initialCtc: number, initialOdc: number, reduction: number) {
	if (reduction <= initialOdc) {
		return { allowedCtc: initialCtc, allowedOdc: initialOdc - reduction }
	}
	const remReduction = reduction - initialOdc
	return { allowedCtc: Math.max(0, initialCtc - remReduction), allowedOdc: 0 }
}

/**
 * Computes Child Tax Credit (CTC), ODC, and refundable Additional Child Tax Credit (ACTC).
 *
 * @statute IRC § 24
 */
export function calculateUsChildCredits(
	credits: UsCreditsInput | undefined,
	magiDollars: number,
	earnedIncomeDollars: number,
	taxAvailableCents: number,
	status: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsChildCreditsResult {
	const children = Math.max(0, Math.floor(credits?.qualifyingChildrenForChildTaxCredit ?? 0))
	const otherDeps = Math.max(0, Math.floor(credits?.otherDependents ?? 0))
	const initCtc = children * params.credits.ctcAmountPerChild
	const initOdc = otherDeps * params.credits.odcAmountPerDependent

	const thresh = params.credits.ctcPhaseoutThresholds[status]
	const excessMagi = Math.max(0, magiDollars - thresh)
	const steps = Math.ceil(excessMagi / params.credits.ctcPhaseoutStepAmount)
	const reduction = steps * params.credits.ctcPhaseoutStepRate
	const { allowedCtc, allowedOdc } = resolveCtcAllocation(initCtc, initOdc, reduction)

	const ctcCents = toMinorUnits(allowedCtc, params.currency)
	const odcCents = toMinorUnits(allowedOdc, params.currency)
	const nonRefCtcUsed = Math.min(ctcCents, taxAvailableCents)
	const nonRefOdcUsed = Math.min(odcCents, taxAvailableCents - nonRefCtcUsed)

	const unusedCtcDollars = allowedCtc - fromMinorUnits(nonRefCtcUsed, params.currency)
	const excessEarned = Math.max(0, earnedIncomeDollars - params.credits.actcEarnedIncomeThreshold)
	const earnedFormula = excessEarned * params.credits.actcRate
	const maxActc = children * params.credits.actcMaxPerChild
	const actcDollars = Math.min(unusedCtcDollars, maxActc, earnedFormula)
	const actcCents = toMinorUnits(actcDollars, params.currency)

	return {
		nonRefundableUsedCents: nonRefCtcUsed + nonRefOdcUsed,
		actcRefundableCents: actcCents,
		breakdown: {
			qualifyingChildren: children,
			otherDependents: otherDeps,
			initialCtc: usd(fromMinorUnits(toMinorUnits(initCtc, params.currency), params.currency)),
			initialOdc: usd(fromMinorUnits(toMinorUnits(initOdc, params.currency), params.currency)),
			phaseoutReduction: usd(
				fromMinorUnits(toMinorUnits(reduction, params.currency), params.currency),
			),
			allowedCtc: usd(fromMinorUnits(ctcCents, params.currency)),
			allowedOdc: usd(fromMinorUnits(odcCents, params.currency)),
			nonRefundableCtcUsed: usd(
				fromMinorUnits(nonRefCtcUsed, params.currency, UsCreditField.ChildTaxCredit),
			),
			nonRefundableOdcUsed: usd(
				fromMinorUnits(nonRefOdcUsed, params.currency, UsCreditField.OtherDependentCredit),
			),
			actcRefundable: usd(
				fromMinorUnits(actcCents, params.currency, UsCreditField.AdditionalChildTaxCredit),
			),
		},
	}
}
