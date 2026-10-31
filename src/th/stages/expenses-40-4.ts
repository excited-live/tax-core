import type { ClampedAmount } from "../../core/caps"

/**
 * Calculates Section 40(4) expense deduction (0% statutory).
 *
 * Math: Thailand Revenue Code permits 0% expense deductions for interest, dividends, crypto.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Section 40(4).
 */
export function calculateExpenses40_4(_incomeAmount: number): ClampedAmount {
	return {
		requested: 0,
		allowed: 0,
		cap: 0,
		wasClamped: false,
	}
}
