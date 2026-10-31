import type { ClampedAmount } from "../../core/caps"
import { validateMonetaryAmount } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import type { ThDonationsBreakdown } from "../types"

export interface ThDonationAllowancesResult {
	readonly breakdown: ThDonationsBreakdown
	readonly allowedDonationsTotal: number
	readonly netTaxableIncome: number
}

/**
 * Calculates qualified 2x and general 1x donation allowances.
 *
 * Math: 2x donations capped at 10% of net before donations; 1x donations capped at 10% of remaining net.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Section 47(7); Royal Decrees No. 428, 558.
 */
export function calculateDonationAllowances(
	donation2x: number | undefined,
	donation1x: number | undefined,
	netBeforeDonations: number,
): ThDonationAllowancesResult {
	const p = TH_2026_PARAMETERS.allowances.donations
	const net = Math.max(0, netBeforeDonations)

	const raw2x = donation2x ?? 0
	validateMonetaryAmount(raw2x, "allowances.donation2x")
	const eligible2x = raw2x * p.donation2xMultiplier
	const cap2x = Math.floor(net * p.donation2xMaxRate)
	const allowed2x = Math.min(eligible2x, cap2x)
	const clamped2x: ClampedAmount = {
		requested: raw2x,
		allowed: allowed2x,
		cap: cap2x,
		wasClamped: eligible2x > cap2x,
	}

	const remainingNet = Math.max(0, net - allowed2x)
	const raw1x = donation1x ?? 0
	validateMonetaryAmount(raw1x, "allowances.donation1x")
	const cap1x = Math.floor(remainingNet * p.donation1xMaxRate)
	const allowed1x = Math.min(raw1x, cap1x)
	const clamped1x: ClampedAmount = {
		requested: raw1x,
		allowed: allowed1x,
		cap: cap1x,
		wasClamped: raw1x > cap1x,
	}

	const breakdown: ThDonationsBreakdown = {
		donation2x: clamped2x,
		donation1x: clamped1x,
		total: allowed2x + allowed1x,
	}

	const netTaxableIncome = Math.max(0, remainingNet - allowed1x)

	return {
		breakdown,
		allowedDonationsTotal: breakdown.total,
		netTaxableIncome,
	}
}
