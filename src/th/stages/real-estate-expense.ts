import { TH_2026_PARAMETERS } from "../parameters"
import { ThRealEstateAcquisitionType, ThRealEstateExpenseBasis } from "../types"

/**
 * Caps the holding period used by Section 48(4) at the statutory maximum.
 *
 * Purpose: More than 10 years of holding counts as 10 years.
 * Math: min(requestedYears, `realEstate.maxHoldingYears`).
 * Units: Dimensionless year count (callers round part-years up).
 * Throws: Never; `requestedYears` is validated by the caller.
 *
 * @param requestedYears Validated positive safe integer holding period.
 * @statute Thailand Revenue Code Section 48(4); Ministerial Regulation No. 126.
 */
export function effectiveHoldingYears(requestedYears: number): number {
	return Math.min(requestedYears, TH_2026_PARAMETERS.realEstate.maxHoldingYears)
}

/**
 * Selects the Section 48(4) expense rate for the acquisition type.
 *
 * Purpose: Inherited or gifted property takes a flat rate; commercial or other property takes the
 * holding-year table. The two are never combined.
 * Math: Flat `inheritanceExpenseRate`, or the last `expenseTable` row with `minYears <= years`.
 * Units: Rate ratio; `years` is the effective (capped) holding period.
 * Throws: Never; the acquisition type is validated by the caller.
 *
 * @param acquisitionType Validated acquisition type.
 * @param years Effective holding years.
 * @statute Thailand Revenue Code Section 48(4); Ministerial Regulation No. 126.
 */
export function resolveRealEstateExpense(
	acquisitionType: ThRealEstateAcquisitionType,
	years: number,
): { readonly basis: ThRealEstateExpenseBasis; readonly rate: number } {
	const rules = TH_2026_PARAMETERS.realEstate
	if (acquisitionType === ThRealEstateAcquisitionType.InheritanceOrGift) {
		return { basis: ThRealEstateExpenseBasis.FlatInheritance, rate: rules.inheritanceExpenseRate }
	}
	const rate = rules.expenseTable.reduce((acc, row) => (years >= row.minYears ? row.rate : acc), 0)
	return { basis: ThRealEstateExpenseBasis.HoldingPeriodTable, rate }
}
