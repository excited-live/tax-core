import type { ClampedAmount } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import { ThExpenseField, type ThSection40_6Input } from "../types"
import { calculateElectableItemExpense } from "./electable-expense"

/**
 * Calculates Section 40(6) liberal professions expense deduction.
 *
 * Math: Medical 60%, law/engineering/architecture/accounting/fine arts/other 30%, or actual.
 * Units: THB major units.
 *
 * @statute Thailand Royal Decree No. 11 Section 6.
 */
export function calculateExpenses40_6(input: ThSection40_6Input | undefined): ClampedAmount {
	if (!input) {
		return { requested: 0, allowed: 0, cap: 0, wasClamped: false }
	}
	const rates = TH_2026_PARAMETERS.expenses.section40_6
	const med = calculateElectableItemExpense(
		input.medical,
		rates.medical,
		ThExpenseField.Section40_6_Medical,
	)
	const law = calculateElectableItemExpense(input.law, rates.other, ThExpenseField.Section40_6_Law)
	const eng = calculateElectableItemExpense(
		input.engineering,
		rates.other,
		ThExpenseField.Section40_6_Engineering,
	)
	const arch = calculateElectableItemExpense(
		input.architecture,
		rates.other,
		ThExpenseField.Section40_6_Architecture,
	)
	const acc = calculateElectableItemExpense(
		input.accounting,
		rates.other,
		ThExpenseField.Section40_6_Accounting,
	)
	const art = calculateElectableItemExpense(
		input.fineArts,
		rates.other,
		ThExpenseField.Section40_6_FineArts,
	)
	const oth = calculateElectableItemExpense(
		input.other,
		rates.other,
		ThExpenseField.Section40_6_Other,
	)

	const requested =
		med.requested +
		law.requested +
		eng.requested +
		arch.requested +
		acc.requested +
		art.requested +
		oth.requested
	const allowed =
		med.allowed + law.allowed + eng.allowed + arch.allowed + acc.allowed + art.allowed + oth.allowed
	const cap = med.cap + law.cap + eng.cap + arch.cap + acc.cap + art.cap + oth.cap

	return {
		requested,
		allowed,
		cap,
		wasClamped: requested > allowed,
	}
}
