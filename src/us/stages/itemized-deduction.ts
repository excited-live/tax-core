import { type ClampedAmount, clampCap } from "../../core/caps"
import { applyPercentage, fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsFilingStatus, UsItemizedBreakdown, UsItemizedDeductionsInput } from "../types"

export interface UsItemizedDeductionResult {
	readonly totalCents: number
	readonly breakdown: UsItemizedBreakdown
}

function resolveMedical(
	medDollars: number | undefined,
	agiCents: number,
	floorRate: number,
): { cents: number; clamped: ClampedAmount } {
	const reqCents = toMinorUnits(medDollars ?? 0, "USD", "medicalExpenses")
	const floorCents = applyPercentage(agiCents, floorRate)
	const allowedCents = Math.max(0, reqCents - floorCents)
	return {
		cents: allowedCents,
		clamped: {
			requested: fromMinorUnits(reqCents, "USD"),
			allowed: fromMinorUnits(allowedCents, "USD"),
			cap: fromMinorUnits(floorCents, "USD"),
			wasClamped: reqCents > 0 && allowedCents < reqCents,
		},
	}
}

function resolveCharity(
	charityDollars: number | undefined,
	agiCents: number,
	ceilRate: number,
): { cents: number; clamped: ClampedAmount } {
	const reqCents = toMinorUnits(charityDollars ?? 0, "USD", "charitableContributions")
	const ceilCents = applyPercentage(agiCents, ceilRate)
	const clamped = clampCap(reqCents, ceilCents, "charitableContributions")
	return {
		cents: clamped.allowed,
		clamped: {
			requested: fromMinorUnits(clamped.requested, "USD"),
			allowed: fromMinorUnits(clamped.allowed, "USD"),
			cap: fromMinorUnits(clamped.cap, "USD"),
			wasClamped: clamped.wasClamped,
		},
	}
}

/**
 * Computes Schedule A Itemized Deductions subject to floors and statutory caps.
 *
 * @statute IRC §§ 164, 170, 213
 */
export function calculateUsItemizedDeductions(
	itemized: UsItemizedDeductionsInput,
	agiCents: number,
	filingStatus: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsItemizedDeductionResult {
	const med = resolveMedical(itemized.medicalExpenses, agiCents, params.itemized.medicalFloorRate)
	const saltCapDollars =
		filingStatus === "married_filing_separately"
			? params.itemized.saltCapMfs
			: params.itemized.saltCap
	const saltReqCents = toMinorUnits(itemized.stateAndLocalTaxes ?? 0, "USD", "stateAndLocalTaxes")
	const saltCapCents = toMinorUnits(saltCapDollars, "USD")
	const saltClamped = clampCap(saltReqCents, saltCapCents, "stateAndLocalTaxes")

	const mortCents = toMinorUnits(itemized.mortgageInterest ?? 0, "USD", "mortgageInterest")
	const charity = resolveCharity(
		itemized.charitableContributions,
		agiCents,
		params.itemized.charityCeilingRate,
	)

	const totalCents = med.cents + saltClamped.allowed + mortCents + charity.cents
	return {
		totalCents,
		breakdown: {
			medical: med.clamped,
			salt: {
				requested: fromMinorUnits(saltClamped.requested, "USD"),
				allowed: fromMinorUnits(saltClamped.allowed, "USD"),
				cap: fromMinorUnits(saltClamped.cap, "USD"),
				wasClamped: saltClamped.wasClamped,
			},
			mortgageInterest: usd(fromMinorUnits(mortCents, "USD")),
			charity: charity.clamped,
			total: usd(fromMinorUnits(totalCents, "USD")),
		},
	}
}
