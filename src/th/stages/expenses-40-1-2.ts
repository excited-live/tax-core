import { type ClampedAmount, clampCap } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import { ThExpenseField } from "../types"

/**
 * Calculates shared Section 40(1) and Section 40(2) expense deduction.
 *
 * Math: 50% of combined 40(1) + 40(2) income, clamped to 100,000 THB ceiling.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Section 42 bis.
 */
export function calculateExpenses40_1_2(s1: number, s2: number): ClampedAmount {
	const combined = s1 + s2
	const requested = Math.floor(combined * TH_2026_PARAMETERS.expenses.section40_1_2.rate)
	return clampCap(
		requested,
		TH_2026_PARAMETERS.expenses.section40_1_2.ceiling,
		ThExpenseField.Section40_1_2,
	)
}
