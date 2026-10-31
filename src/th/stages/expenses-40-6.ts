import type { ClampedAmount } from "../../core/caps"
import { TH_2026_PARAMETERS } from "../parameters"
import type { ThSection40_6Input } from "../types"
import { calculateElectableItemExpense } from "./electable-expense"

export enum ThSection40_6Field {
	Medical = "expense.40_6.medical",
	Law = "expense.40_6.law",
	Engineering = "expense.40_6.eng",
	Architecture = "expense.40_6.arch",
	Accounting = "expense.40_6.acc",
	FineArts = "expense.40_6.art",
	Other = "expense.40_6.other",
}

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
		ThSection40_6Field.Medical,
	)
	const law = calculateElectableItemExpense(input.law, rates.other, ThSection40_6Field.Law)
	const eng = calculateElectableItemExpense(
		input.engineering,
		rates.other,
		ThSection40_6Field.Engineering,
	)
	const arch = calculateElectableItemExpense(
		input.architecture,
		rates.other,
		ThSection40_6Field.Architecture,
	)
	const acc = calculateElectableItemExpense(
		input.accounting,
		rates.other,
		ThSection40_6Field.Accounting,
	)
	const art = calculateElectableItemExpense(
		input.fineArts,
		rates.other,
		ThSection40_6Field.FineArts,
	)
	const oth = calculateElectableItemExpense(input.other, rates.other, ThSection40_6Field.Other)

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
