import { fromMinorUnits, toMinorUnits } from "../../core/money"
import { TH_2026_PARAMETERS } from "../parameters"
import {
	ThBracketField,
	type ThCombinedTaxBreakdown,
	ThSpecialRegimeField,
	ThTaxField,
} from "../types"

/** Component taxes, credits, and payments to combine. Units: THB major units. */
export interface ThCombineInput {
	readonly regularTax: number
	readonly separateSheetTax: number
	readonly realEstateTax: number
	readonly finalWithholdingTax: number
	readonly dividendTaxCredit: number
	readonly withholdingTax: number
}

/**
 * Combines regular, separate sheet, real estate, and final withholding taxes into one liability.
 *
 * Math: totalCombinedTax = regular + separate sheet + real estate + final withholding (before credits);
 * netTaxPayable = totalCombinedTax - final withholding (already withheld at source)
 * - Section 47 bis dividend credit - withholding tax paid. May be negative (refund).
 * Units: Inputs and outputs in THB major units; arithmetic in integer satang.
 * Throws: TaxValidationError if any component is negative or non-finite.
 *
 * @statute Thailand Revenue Code Sections 40(4), 47 bis, 48(1)–(5).
 */
export function combineThLiability(input: ThCombineInput): ThCombinedTaxBreakdown {
	const currency = TH_2026_PARAMETERS.currency
	const minor = (value: number, field: string): number => toMinorUnits(value, currency, field)
	const regular = minor(input.regularTax, ThSpecialRegimeField.RegularTax)
	const sheet = minor(input.separateSheetTax, ThSpecialRegimeField.SeparateSheetTax)
	const estate = minor(input.realEstateTax, ThSpecialRegimeField.RealEstateTax)
	const final = minor(input.finalWithholdingTax, ThSpecialRegimeField.FinalWithholdingTax)
	const credit = minor(input.dividendTaxCredit, ThSpecialRegimeField.DividendTaxCredit)
	const withheld = minor(input.withholdingTax, ThTaxField.WithholdingTax)

	const total = regular + sheet + estate + final
	const credits = final + credit + withheld
	return {
		totalCombinedTax: fromMinorUnits(total, currency, ThTaxField.TotalTax),
		creditsAndPayments: fromMinorUnits(credits, currency),
		netTaxPayable: fromMinorUnits(total - credits, currency, ThTaxField.NetTaxPayable, {
			allowNegative: true,
		}),
	}
}

/**
 * Sums non-negative THB amounts exactly in integer satang.
 *
 * Math: Converts each amount to satang, adds, converts back to major units.
 * Units: THB major units in and out.
 * Throws: TaxValidationError if any amount is negative or non-finite.
 *
 * @statute Thailand Revenue Code Section 40 (gross income aggregation).
 */
export function sumThAmounts(values: readonly number[]): number {
	const currency = TH_2026_PARAMETERS.currency
	const minor = values.reduce(
		(sum, v) => sum + toMinorUnits(v, currency, ThBracketField.GrossIncome),
		0,
	)
	return fromMinorUnits(minor, currency)
}
