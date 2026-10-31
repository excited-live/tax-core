import { type ClampedAmount, clampCap } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import type { ThAllowancesInput, ThFilingStatus } from "../types"

export interface ThInsuranceAllowancesResult {
	readonly socialSecurity: ClampedAmount
	readonly lifeInsurance: ClampedAmount
	readonly parentHealthInsurance: ClampedAmount
	readonly spouseLifeInsurance: ClampedAmount
	readonly mortgageInterest: ClampedAmount
}

/**
 * Calculates insurance, social security, and housing mortgage interest allowances.
 *
 * @statute Thailand Revenue Code Section 47(1)(d), (g), (h), (j).
 */
export function calculateInsuranceAllowances(
	input: ThAllowancesInput = {},
	filingStatus: ThFilingStatus = "single",
): ThInsuranceAllowancesResult {
	const p = TH_2026_PARAMETERS.allowances

	const socialSecurity = clampCap(
		input.socialSecurity ?? 0,
		p.socialSecurityFundCeiling,
		"allowances.socialSecurity",
	)

	const healthClamped = clampCap(
		input.healthInsurance ?? 0,
		p.lifeInsurance.healthCeiling,
		"allowances.healthInsurance",
	)
	const rawLife = input.lifeInsurance ?? 0
	const lifeCombinedRequested = rawLife + (input.healthInsurance ?? 0)
	const lifeEffectiveRequested = rawLife + healthClamped.allowed
	const lifeCombined = clampCap(
		lifeEffectiveRequested,
		p.lifeInsurance.combinedCeiling,
		"allowances.lifeInsurance",
	)
	const lifeInsurance: ClampedAmount = {
		requested: lifeCombinedRequested,
		allowed: lifeCombined.allowed,
		cap: p.lifeInsurance.combinedCeiling,
		wasClamped: lifeCombinedRequested > lifeCombined.allowed,
	}

	const parentHealthInsurance = clampCap(
		input.parentHealthInsurance ?? 0,
		p.parentHealthInsuranceCeiling,
		"allowances.parentHealthInsurance",
	)

	const isSpouseEligible = filingStatus === "married_no_income_spouse"
	const spouseLifeReq = input.spouseLifeInsurance ?? 0
	const spouseLifeInsurance: ClampedAmount = isSpouseEligible
		? clampCap(spouseLifeReq, p.spouseLifeInsuranceCeiling, "allowances.spouseLifeInsurance")
		: {
				requested: spouseLifeReq,
				allowed: 0,
				cap: 0,
				wasClamped: spouseLifeReq > 0,
			}

	const mortgageInterest = clampCap(
		input.mortgageInterest ?? 0,
		p.mortgageInterestCeiling,
		"allowances.mortgageInterest",
	)

	return {
		socialSecurity,
		lifeInsurance,
		parentHealthInsurance,
		spouseLifeInsurance,
		mortgageInterest,
	}
}
