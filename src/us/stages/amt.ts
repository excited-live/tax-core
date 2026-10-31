import { fromMinorUnits, toMinorUnits, usd } from "../../core/money"
import type { US_2026_PARAMETERS } from "../parameters"
import type { UsAmtBreakdown, UsFilingStatus } from "../types"
import { UsAmtField } from "../types/fields"

export interface UsAmtResult {
	readonly amtTaxCents: number
	readonly tentativeMinimumTaxCents: number
	readonly breakdown: UsAmtBreakdown
}

/**
 * Computes Form 6251 Alternative Minimum Tax (AMT).
 *
 * @statute IRC § 55
 */
export function calculateUsAmt(
	taxableIncomeCents: number,
	saltDeductionCents: number,
	preferencesDollars: number | undefined,
	regularTaxCents: number,
	filingStatus: UsFilingStatus,
	params: typeof US_2026_PARAMETERS,
): UsAmtResult {
	const prefCents = toMinorUnits(preferencesDollars ?? 0, params.currency, UsAmtField.Preferences)
	const amtiCents = taxableIncomeCents + saltDeductionCents + prefCents

	const baseExemptionCents = toMinorUnits(params.amt.baseExemptions[filingStatus], params.currency)
	const phaseoutCents = toMinorUnits(params.amt.phaseoutThresholds[filingStatus], params.currency)
	const excessAmtiCents = Math.max(0, amtiCents - phaseoutCents)
	const reductionCents = Math.round(excessAmtiCents * params.amt.phaseoutRate)
	const allowedExemptionCents = Math.max(0, baseExemptionCents - reductionCents)

	const amtBaseCents = Math.max(0, amtiCents - allowedExemptionCents)
	const cap26Cents = toMinorUnits(params.amt.rate26Thresholds[filingStatus], params.currency)

	let tmtCents: number
	if (amtBaseCents <= cap26Cents) {
		tmtCents = Math.round(amtBaseCents * params.amt.rate26)
	} else {
		tmtCents = Math.round(
			cap26Cents * params.amt.rate26 + (amtBaseCents - cap26Cents) * params.amt.rate28,
		)
	}

	const amtTaxCents = Math.max(0, tmtCents - regularTaxCents)

	return {
		amtTaxCents,
		tentativeMinimumTaxCents: tmtCents,
		breakdown: {
			taxableIncome: usd(fromMinorUnits(taxableIncomeCents, params.currency)),
			saltAddBack: usd(fromMinorUnits(saltDeductionCents, params.currency)),
			preferences: usd(fromMinorUnits(prefCents, params.currency, UsAmtField.Preferences)),
			amti: usd(fromMinorUnits(amtiCents, params.currency, UsAmtField.Amti)),
			baseExemption: usd(fromMinorUnits(baseExemptionCents, params.currency)),
			phaseoutThreshold: usd(fromMinorUnits(phaseoutCents, params.currency)),
			exemptionReduction: usd(fromMinorUnits(reductionCents, params.currency)),
			allowedExemption: usd(
				fromMinorUnits(allowedExemptionCents, params.currency, UsAmtField.Exemption),
			),
			amtTaxableBase: usd(fromMinorUnits(amtBaseCents, params.currency)),
			tentativeMinimumTax: usd(
				fromMinorUnits(tmtCents, params.currency, UsAmtField.TentativeMinimumTax),
			),
			regularTax: usd(fromMinorUnits(regularTaxCents, params.currency)),
			amtTax: usd(fromMinorUnits(amtTaxCents, params.currency, UsAmtField.AmtTax)),
		},
	}
}
