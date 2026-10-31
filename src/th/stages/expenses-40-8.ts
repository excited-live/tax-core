import { type ClampedAmount, clampCap } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import type { ThExpenseElectableIncome, ThSection40_8Input } from "../types"
import { calculateElectableItemExpense } from "./electable-expense"

function calculateEntertainerExpense(
	item: number | ThExpenseElectableIncome | undefined,
): ClampedAmount {
	if (!item) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	const amount = typeof item === "number" ? item : item.amount
	if (amount <= 0) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	if (typeof item === "object" && item.expenseElection === "actual") {
		return clampCap(item.actualExpense ?? 0, amount, "expense.40_8.entertainer")
	}
	const p = TH_2026_PARAMETERS.expenses.section40_8
	const tier1 = Math.min(amount, p.entertainerFirstTierThreshold)
	const tier2 = Math.max(0, amount - p.entertainerFirstTierThreshold)
	const computed =
		Math.floor(tier1 * p.entertainerFirstTierRate) + Math.floor(tier2 * p.entertainerSecondTierRate)
	return clampCap(computed, p.entertainerCeiling, "expense.40_8.entertainer")
}

/**
 * Calculates Section 40(8) business, commerce, and entertainer expense deduction.
 *
 * Math: General 60% or actual; entertainer tiered 60%/40% up to 600,000 THB or actual.
 * Units: THB major units.
 *
 * @statute Thailand Royal Decree No. 11 Section 8.
 */
export function calculateExpenses40_8(
	input: number | ThExpenseElectableIncome | ThSection40_8Input | undefined,
): ClampedAmount {
	if (!input) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	if (typeof input === "number" || "amount" in input) {
		return calculateElectableItemExpense(
			input as number | ThExpenseElectableIncome,
			TH_2026_PARAMETERS.expenses.section40_8.generalRate,
			"expense.section40_8",
		)
	}
	const gen = calculateElectableItemExpense(
		input.general,
		TH_2026_PARAMETERS.expenses.section40_8.generalRate,
		"expense.40_8.general",
	)
	const ent = calculateEntertainerExpense(input.entertainer)
	const requested = gen.requested + ent.requested
	const allowed = gen.allowed + ent.allowed
	const cap = gen.cap + ent.cap
	return {
		requested,
		allowed,
		cap,
		wasClamped: requested > allowed,
	}
}
