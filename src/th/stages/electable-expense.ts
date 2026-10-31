import { type ClampedAmount, clampCap } from "../../core/caps"
import type { ThExpenseElectableIncome } from "../types"

/**
 * Computes expense deduction for an electable income item (standard % vs actual).
 *
 * Math: If actual, clamp to item income. If standard, apply percentage of item income.
 * Units: THB major units.
 *
 * @param item Income item number or configuration object.
 * @param standardRate Statutory percentage rate for standard deduction.
 * @param field Diagnostic field name.
 */
export function calculateElectableItemExpense(
	item: number | ThExpenseElectableIncome | undefined,
	standardRate: number,
	field: string,
): ClampedAmount {
	if (!item) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	const amount = typeof item === "number" ? item : item.amount
	if (amount <= 0) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	const isActual = typeof item === "object" && item.expenseElection === "actual"
	if (isActual) {
		const req = item.actualExpense ?? 0
		return clampCap(req, amount, field)
	}
	const req = Math.floor(amount * standardRate)
	return { requested: req, allowed: req, cap: amount, wasClamped: false }
}
