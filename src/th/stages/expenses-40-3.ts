import { type ClampedAmount, clampCap } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import type { ThExpenseElectableIncome } from "../types"

/**
 * Calculates Section 40(3) royalties/goodwill/copyright expense deduction.
 *
 * Math: Standard 50% capped at 100,000 THB or actual expenses capped at income.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Section 42 ter; Royal Decree No. 11 Section 4.
 */
export function calculateExpenses40_3(
	input: number | ThExpenseElectableIncome | undefined,
	incomeAmount: number,
): ClampedAmount {
	if (incomeAmount <= 0) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	const isActual = typeof input === "object" && input.expenseElection === "actual"
	if (isActual) {
		const requested = input.actualExpense ?? 0
		return clampCap(requested, incomeAmount, "expense.section40_3")
	}
	const requested = Math.floor(incomeAmount * TH_2026_PARAMETERS.expenses.section40_3.rate)
	return clampCap(requested, TH_2026_PARAMETERS.expenses.section40_3.ceiling, "expense.section40_3")
}
