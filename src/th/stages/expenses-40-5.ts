import type { ClampedAmount } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import type { ThSection40_5Input } from "../types"
import { calculateElectableItemExpense } from "./electable-expense"

/**
 * Calculates Section 40(5) rental expense deductions across property sub-categories.
 *
 * Math: Standard percentage per property class or actual expenses capped at income.
 * Units: THB major units.
 *
 * @statute Thailand Royal Decree No. 11 Section 5.
 */
export function calculateExpenses40_5(input: ThSection40_5Input | undefined): ClampedAmount {
	if (!input) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	const rates = TH_2026_PARAMETERS.expenses.section40_5
	const b = calculateElectableItemExpense(input.building, rates.building, "expense.40_5.building")
	const a = calculateElectableItemExpense(
		input.agriculturalLand,
		rates.agriculturalLand,
		"expense.40_5.agri",
	)
	const na = calculateElectableItemExpense(
		input.nonAgriculturalLand,
		rates.nonAgriculturalLand,
		"expense.40_5.nonAgri",
	)
	const v = calculateElectableItemExpense(input.vehicles, rates.vehicles, "expense.40_5.vehicles")
	const o = calculateElectableItemExpense(input.other, rates.other, "expense.40_5.other")

	const requested = b.requested + a.requested + na.requested + v.requested + o.requested
	const allowed = b.allowed + a.allowed + na.allowed + v.allowed + o.allowed
	const cap = b.cap + a.cap + na.cap + v.cap + o.cap

	return {
		requested,
		allowed,
		cap,
		wasClamped: requested > allowed,
	}
}
