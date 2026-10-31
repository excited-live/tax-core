import type { ClampedAmount } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import { type ThExpenseElectableIncome, ThExpenseField } from "../types"
import { calculateElectableItemExpense } from "./electable-expense"

/**
 * Calculates Section 40(7) contracting expense deduction.
 *
 * Math: Standard 60% or actual expenses capped at income.
 * Units: THB major units.
 *
 * @statute Thailand Royal Decree No. 11 Section 7.
 */
export function calculateExpenses40_7(
	input: number | ThExpenseElectableIncome | undefined,
): ClampedAmount {
	return calculateElectableItemExpense(
		input,
		TH_2026_PARAMETERS.expenses.section40_7.rate,
		ThExpenseField.Section40_7,
	)
}
