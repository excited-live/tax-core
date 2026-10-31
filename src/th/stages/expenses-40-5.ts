import type { ClampedAmount } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import { ThExpenseField, type ThSection40_5Input } from "../types"
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
	const b = calculateElectableItemExpense(
		input.building,
		rates.building,
		ThExpenseField.Section40_5_Building,
	)
	const a = calculateElectableItemExpense(
		input.agriculturalLand,
		rates.agriculturalLand,
		ThExpenseField.Section40_5_AgriculturalLand,
	)
	const na = calculateElectableItemExpense(
		input.nonAgriculturalLand,
		rates.nonAgriculturalLand,
		ThExpenseField.Section40_5_NonAgriculturalLand,
	)
	const v = calculateElectableItemExpense(
		input.vehicles,
		rates.vehicles,
		ThExpenseField.Section40_5_Vehicles,
	)
	const o = calculateElectableItemExpense(
		input.other,
		rates.other,
		ThExpenseField.Section40_5_Other,
	)

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
