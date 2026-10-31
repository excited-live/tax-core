import { applyPercentage, fromMinorUnits, toMinorUnits } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import { type ThMinimumGrossTaxBreakdown, ThTaxField } from "../types"

/**
 * Calculates Section 48(2) Minimum Gross Tax on Section 40(2)–40(8) income.
 *
 * Math: 0.5% of gross Section 40(2)–(8) if gross >= 120,000 THB; payable only if the 0.5% tax exceeds 5,000 THB
 * and exceeds the progressive tax.
 * Units: THB major units.
 *
 * @statute Thailand Revenue Code Section 48(2).
 */
export function calculateMinimumGrossTax(
	grossNonEmploymentIncome: number,
	progressiveTax: number,
): ThMinimumGrossTaxBreakdown {
	const p = TH_2026_PARAMETERS.minimumGrossTax
	if (grossNonEmploymentIncome < p.incomeThreshold) {
		return {
			grossEligibleIncome: grossNonEmploymentIncome,
			rate: p.rate,
			calculatedTax: 0,
			threshold: p.taxThreshold,
			isApplicable: false,
			wasApplied: false,
		}
	}

	const currency = TH_2026_PARAMETERS.currency
	const minorIncome = toMinorUnits(grossNonEmploymentIncome, currency, ThTaxField.MinimumGrossTax)
	const minorTax = applyPercentage(minorIncome, p.rate)
	const calculatedTax = fromMinorUnits(minorTax, currency)

	const isApplicable = calculatedTax > p.taxThreshold
	const wasApplied = isApplicable && calculatedTax > progressiveTax

	return {
		grossEligibleIncome: grossNonEmploymentIncome,
		rate: p.rate,
		calculatedTax,
		threshold: p.taxThreshold,
		isApplicable,
		wasApplied,
	}
}
